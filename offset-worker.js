self.onmessage = function(e) {
    const { imageData, width, height, extremePoints, averages, timestamp, partNames } = e.data;
    
    const variations = [];
    
    // Create offset variations
    for (let x = -50; x <= 50; x += 50) {
        for (let y = -50; y <= 50; y += 50) {
            const shiftedImageData = new Uint8ClampedArray(width * height * 4);
            const tempBuffer = new Uint8ClampedArray(width * height * 4);
            
            // Apply offset transformation
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    const sourceIdx = (py * width + px) * 4;
                    const newX = px + x;
                    const newY = py + y;
                    
                    if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                        const targetIdx = (Math.round(newY) * width + Math.round(newX)) * 4;
                        if (imageData.data[sourceIdx + 3] > 0) {
                            tempBuffer[targetIdx] = imageData.data[sourceIdx];
                            tempBuffer[targetIdx + 1] = imageData.data[sourceIdx + 1];
                            tempBuffer[targetIdx + 2] = imageData.data[sourceIdx + 2];
                            tempBuffer[targetIdx + 3] = imageData.data[sourceIdx + 3];
                        }
                    }
                }
            }
            
            shiftedImageData.set(tempBuffer);
            
            // Transform keypoints with offset
            const shiftedExtremePoints = {};
            const shiftedAverages = {};
            
            // Transform extreme points
            if (extremePoints) {
                Object.entries(extremePoints).forEach(([partName, points]) => {
                    if (points) {
                        shiftedExtremePoints[partName] = {
                            top: points.top ? { x: points.top.x + x, y: points.top.y + y } : null,
                            bottom: points.bottom ? { x: points.bottom.x + x, y: points.bottom.y + y } : null
                        };
                    }
                });
            }
            
            // Transform averages
            if (averages) {
                Object.entries(averages).forEach(([partName, points]) => {
                    if (points) {
                        shiftedAverages[partName] = {
                            top: points.top ? { x: points.top.x + x, y: points.top.y + y } : null,
                            bottom: points.bottom ? { x: points.bottom.x + x, y: points.bottom.y + y } : null
                        };
                    }
                });
            }
            
            variations.push({
                imageData: shiftedImageData,
                width,
                height,
                extremePoints: shiftedExtremePoints,
                averages: shiftedAverages,
                shift: { x, y },
                partNames
            });
        }
    }
    
    self.postMessage({
        type: 'offsetVariations',
        variations,
        timestamp,
        partNames
    });
};