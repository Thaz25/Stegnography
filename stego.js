/**
 * StegoLab: The Rhino Protocol
 * Core Steganography Logic (Simple LSB - No Encryption)
 */

export class StegoError extends Error {
    constructor(message) {
        super(message);
        this.name = "StegoError";
    }
}

export const Stego = {
    // --- UTILS ---
    textToBinary(str) {
        return str.split('').map(char => {
            const binary = char.charCodeAt(0).toString(2);
            return '0'.repeat(8 - binary.length) + binary;
        }).join('');
    },

    binaryToText(bin) {
        const bytes = bin.match(/.{1,8}/g) || [];
        return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
    },

    // --- STEGO ---

    /**
     * Encodes a secret message into an image using LSB
     */
    encode(imageFile, secretMessage) {
        return new Promise((resolve, reject) => {
            try {
                // Add header and null terminator
                const finalPayload = "RHI" + secretMessage + String.fromCharCode(0);

                const img = new Image();
                img.src = URL.createObjectURL(imageFile);

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    ctx.drawImage(img, 0, 0);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;

                    const binaryMessage = this.textToBinary(finalPayload);

                    if (binaryMessage.length > data.length / 4) {
                        reject(new StegoError("Message too long for this cover image."));
                        return;
                    }

                    let bitIndex = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        if (bitIndex >= binaryMessage.length) break;
                        // Modify the Red channel's LSB
                        data[i] = (data[i] & 254) | parseInt(binaryMessage[bitIndex]);
                        bitIndex++;
                    }

                    ctx.putImageData(imgData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => reject(new Error("Failed to load image"));

            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Decodes a message from an image
     */
    decode(imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                let binaryMessage = "";

                // Extract LSB from Red channel
                for (let i = 0; i < data.length; i += 4) {
                    const lsb = data[i] & 1;
                    binaryMessage += lsb;
                }

                const allText = this.binaryToText(binaryMessage);

                // Check for RHI header
                if (allText.startsWith("RHI")) {
                    const nullIndex = allText.indexOf(String.fromCharCode(0));
                    if (nullIndex !== -1) {
                        const payload = allText.substring(3, nullIndex);
                        resolve(payload);
                    } else {
                        reject(new StegoError("Message corrupted or not found."));
                    }
                } else {
                    reject(new StegoError("No Rhino Protocol signature found."));
                }
            };

            img.onerror = () => reject(new Error("Failed to load image"));
        });
    },

    /**
     * Analyzes bit planes for forensics
     */
    analyze(imageFile, planeIndex = 0) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const bit = (data[i] >> planeIndex) & 1;
                    const val = bit * 255;
                    data[i] = val;
                    data[i + 1] = val;
                    data[i + 2] = val;
                }

                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL());
            };

            img.onerror = () => reject(new Error("Failed to load image"));
        });
    }
};
