import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import MarksRecord from "../contracts/MarksRecord.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// 👇 Replace this with your deployed contract address from Hardhat
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

interface MarksContextType {
  marks: number | null;
  setMarks: (newMarks: number) => Promise<void>;
  fetchMarks: (studentAddress: string) => Promise<void>;
}

const MarksContext = createContext<MarksContextType | undefined>(undefined);

export const MarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marks, setMarksState] = useState<number | null>(null);

  const getContract = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, MarksRecord.abi, signer);
  };

  const setMarks = async (newMarks: number) => {
    const contract = await getContract();
    const tx = await contract.setMarks(newMarks);
    await tx.wait();
    setMarksState(newMarks);
  };

  const fetchMarks = async (studentAddress: string) => {
    const contract = await getContract();
    const result = await contract.getMarks(studentAddress);
    setMarksState(Number(result));
  };

  return (
    <MarksContext.Provider value={{ marks, setMarks, fetchMarks }}>
      {children}
    </MarksContext.Provider>
  );
};

export const useMarks = () => {
  const context = useContext(MarksContext);
  if (!context) throw new Error("useMarks must be used inside MarksProvider");
  return context;
};
