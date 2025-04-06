// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    for (let y = 0; y < fgImg.height; y++) {
        for (let x = 0; x < fgImg.width; x++) {
            let bgX = x + fgPos.x;
            let bgY = y + fgPos.y;
        
            if (bgX >= 0 && bgX < bgImg.width && bgY >= 0 && bgY < bgImg.height) {
                let fgPixel = (y * fgImg.width + x) * 4;
                let bgPixel = (bgY * bgImg.width + bgX) * 4;

                let fgAlpha = fgOpac * fgImg.data[fgPixel + 3] / 255;
                let bgAlpha = bgImg.data[bgPixel + 3] / 255;
                
                let alpha = fgAlpha + (1 - fgAlpha) * bgAlpha;

                for (let i = 0; i < 3; i++) {
                    bgImg.data[bgPixel + i] = (fgAlpha * fgImg.data[fgPixel + i] + (1 - fgAlpha) * bgAlpha * bgImg.data[bgPixel + i]) / alpha;
                }

                bgImg.data[bgPixel + 3] = alpha * 255;
            }
        }
    }
}
