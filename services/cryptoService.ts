// In a real app, use Web Crypto API. This is a simulation for the prototype.

export const generateVoteId = () => {
  return crypto.randomUUID();
};

export const encryptVote = async (candidateId: string, publicKey: string): Promise<{ encryptedData: string; hash: string }> => {
  // Simulate delay for encryption
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const rawPayload = JSON.stringify({ candidateId, salt: Math.random() });
  
  // Simulated encryption (Base64 of reversed string + key signature)
  const encryptedData = btoa(rawPayload.split('').reverse().join('')) + `.${publicKey.substring(0, 5)}`;
  
  // Simulated Integrity Hash
  const hash = btoa(`HASH-${candidateId}-${Date.now()}`);
  
  return { encryptedData, hash };
};

export const decryptVote = (encryptedData: string, privateKey: string): string | null => {
  // Simulate decryption requiring keys
  if (!privateKey) return null;
  
  try {
    const payloadPart = encryptedData.split('.')[0];
    const decryptedString = atob(payloadPart).split('').reverse().join('');
    const parsed = JSON.parse(decryptedString);
    return parsed.candidateId;
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};
