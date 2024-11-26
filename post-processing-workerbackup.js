self.onmessage = function(e) {
    const { 
        type, 
        imageData, 
        width, 
        height, 
        bodyPartImages, 
        extremePoints, 
        averages, 
        timestamp, 
        partNames, 
        rotationAngles,
        offsets = {
            global: { x: 50, y: 50 }
        }
    } = e.data;

    // Apply offset to image data
    function applyOffsetToImageData(imageData, width, height, offsetX, offsetY) {
        const newData = new Uint8ClampedArray(width * height * 4);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const newX = x - offsetX;
                const newY = y - offsetY;
                
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                    const targetIdx = (y * width + x) * 4;
                    const sourceIdx = (newY * width + newX) * 4;
                    
                    newData[targetIdx] = imageData[sourceIdx];
                    newData[targetIdx + 1] = imageData[sourceIdx + 1];
                    newData[targetIdx + 2] = imageData[sourceIdx + 2];
                    newData[targetIdx + 3] = imageData[sourceIdx + 3];
                }
            }
        }
        
        return newData;
    }

    // Apply offset to extreme points
    function applyOffsetToExtremePoints(points, offsetX, offsetY) {
        if (!points) return points;
        
        const offsetPoints = { ...points };
        for (let key in offsetPoints) {
            if (offsetPoints[key] && offsetPoints[key].top) {
                offsetPoints[key].top = {
                    x: points[key].top.x + offsetX,
                    y: points[key].top.y + offsetY
                };
            }
            if (offsetPoints[key] && offsetPoints[key].bottom) {
                offsetPoints[key].bottom = {
                    x: points[key].bottom.x + offsetX,
                    y: points[key].bottom.y + offsetY
                };
            }
        }
        return offsetPoints;
    }

    // Apply offset to averages
    function applyOffsetToAverages(averages, offsetX, offsetY) {
        if (!averages) return averages;
        
        const offsetAverages = { ...averages };
        for (let key in offsetAverages) {
            if (offsetAverages[key] && offsetAverages[key].top) {
                offsetAverages[key].top = {
                    x: averages[key].top.x + offsetX,
                    y: averages[key].top.y + offsetY
                };
            }
            if (offsetAverages[key] && offsetAverages[key].bottom) {
                offsetAverages[key].bottom = {
                    x: averages[key].bottom.x + offsetX,
                    y: averages[key].bottom.y + offsetY
                };
            }
        }
        return offsetAverages;
    }

    // Rest of the existing rotation and processing logic remains the same
    // (rotatePoint, rotateSegment functions would be identical to previous version)

    if (type === 'combinedResults') {
        const variations = [];
        const globalOffset = offsets?.global || { x: 0, y: 0 };

        // Apply offset to image data, extreme points, and averages
        const offsetImageData = applyOffsetToImageData(imageData.data, width, height, globalOffset.x, globalOffset.y);
        const offsetExtremePoints = applyOffsetToExtremePoints(extremePoints, globalOffset.x, globalOffset.y);
        const offsetAverages = applyOffsetToAverages(averages, globalOffset.x, globalOffset.y);

        // Apply global offset to the entire image first
        const globalOffsetImageData = offsets?.global 
            ? applyGlobalOffset(imageData.data, width, height, offsets.global.x, offsets.global.y)
            : new Uint8ClampedArray(imageData.data);
            function applyGlobalOffset(imageData, width, height, offsetX, offsetY) {
                const newData = new Uint8ClampedArray(width * height * 4);
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const newX = x - offsetX;
                        const newY = y - offsetY;
                        
                        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                            const targetIdx = (y * width + x) * 4;
                            const sourceIdx = (newY * width + newX) * 4;
                            
                            newData[targetIdx] = imageData[sourceIdx];
                            newData[targetIdx + 1] = imageData[sourceIdx + 1];
                            newData[targetIdx + 2] = imageData[sourceIdx + 2];
                            newData[targetIdx + 3] = imageData[sourceIdx + 3];
                        }
                    }
                }
                
                return newData;
            }
        
            // Rotation and point manipulation functions (unchanged from previous examples)
            function rotatePoint(point, center, angle) {
                const radians = (angle * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                
                const dx = point.x - center.x;
                const dy = point.y - center.y;
                
                return {
                    x: center.x + (dx * cos - dy * sin),
                    y: center.y + (dx * sin + dy * cos)
                };
            }
            function rotateSegment(segmentData, width, height, angle, center) {
                const radians = (angle * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                const rotatedData = new Uint8ClampedArray(width * height * 4);
            
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const dx = x - center.x;
                        const dy = y - center.y;
                        const srcX = Math.round(center.x + (dx * cos + dy * sin));
                        const srcY = Math.round(center.y + (-dx * sin + dy * cos));
            
                        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                            const targetIdx = (y * width + x) * 4;
                            const sourceIdx = (srcY * width + srcX) * 4;
            
                            if (segmentData[sourceIdx + 3] > 0) {  // Check if pixel is non-transparent
                                rotatedData[targetIdx] = segmentData[sourceIdx];
                                rotatedData[targetIdx + 1] = segmentData[sourceIdx + 1];
                                rotatedData[targetIdx + 2] = segmentData[sourceIdx + 2];
                                rotatedData[targetIdx + 3] = segmentData[sourceIdx + 3];
                            }
                        }
                    }
                }
            
                return rotatedData;
            }
        
        // Handle rotations for both front and back segments
        rotationAngles.forEach(angle => {
            const finalImageData = new Uint8ClampedArray(globalOffsetImageData);
            const rotatedPoints = { ...extremePoints };

            // Process front segment
            if (bodyPartImages?.left_upper_arm_front?.[0] && extremePoints.leftUpperArmFront) {
                const frontPoints = extremePoints.leftUpperArmFront;
                const frontRotationCenter = averages.left_upper_arm.top;
                const frontSegmentData = bodyPartImages.left_upper_arm_front[0].imageData;

                const rotatedFrontSegment = rotateSegment(
                    frontSegmentData,
                    width,
                    height,
                    angle,
                    frontRotationCenter
                );

                // Blend the rotated front segment
                for (let i = 0; i < rotatedFrontSegment.length; i += 4) {
                    if (rotatedFrontSegment[i + 3] > 0) {
                        finalImageData[i] = rotatedFrontSegment[i];
                        finalImageData[i + 1] = rotatedFrontSegment[i + 1];
                        finalImageData[i + 2] = rotatedFrontSegment[i + 2];
                        finalImageData[i + 3] = rotatedFrontSegment[i + 3];
                    }
                }

                // Update front keypoints
                rotatedPoints.leftUpperArmFront = {
                    top: rotatePoint(frontPoints.top, frontRotationCenter, angle),
                    bottom: rotatePoint(frontPoints.bottom, frontRotationCenter, angle)
                };
            }

            // Process back segment (similar to front segment)
            if (bodyPartImages?.left_upper_arm_back?.[0] && extremePoints.leftUpperArmBack) {
                const backPoints = extremePoints.leftUpperArmBack;
                const backRotationCenter = averages.left_upper_arm.top;
                const backSegmentData = bodyPartImages.left_upper_arm_back[0].imageData;

                const rotatedBackSegment = rotateSegment(
                    backSegmentData,
                    width,
                    height,
                    angle,
                    backRotationCenter
                );

                // Blend the rotated back segment
                for (let i = 0; i < rotatedBackSegment.length; i += 4) {
                    if (rotatedBackSegment[i + 3] > 0) {
                        finalImageData[i] = rotatedBackSegment[i];
                        finalImageData[i + 1] = rotatedBackSegment[i + 1];
                        finalImageData[i + 2] = rotatedBackSegment[i + 2];
                        finalImageData[i + 3] = rotatedBackSegment[i + 3];
                    }
                }

                // Update back keypoints
                rotatedPoints.leftUpperArmBack = {
                    top: rotatePoint(backPoints.top, backRotationCenter, angle),
                    bottom: rotatePoint(backPoints.bottom, backRotationCenter, angle)
                };
            }

            variations.push({
                imageData: finalImageData,
                width,
                height,
                extremePoints: rotatedPoints,
                averages,
                shift: globalOffset,
                rotation: angle,
                rotationCenter: averages.left_upper_arm.top,
                partName: partNames
            });
        });

        // Add the original variation with global offset
        variations.push({
            imageData: globalOffsetImageData,
            width,
            height,
            extremePoints,
            averages,
            shift: globalOffset,
            rotation: 0,
            partName: partNames
        });

        self.postMessage({
            type: 'processedVariations',
            variations,
            timestamp,
            partNames
        });
    }
};

