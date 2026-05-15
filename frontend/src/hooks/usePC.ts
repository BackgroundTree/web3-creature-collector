import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../contracts/config';

export interface CreatureNFTData {
  id: bigint;
  speciesId: number;
  level: number;
  ivs: number[];
  heldItemIds: number[];
}

export function usePC() {
  const { address } = useAccount();

  const { data, isPending, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.creatureNFT as `0x${string}`,
    abi: CONTRACT_ABIS.creatureNFT,
    functionName: 'getOwnedCreatures',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Data returns as [ids[], Stats[]] from Solidity
  const ownedCreatures: CreatureNFTData[] = [];
  
  if (data && Array.isArray(data)) {
    const [ids, stats] = data as [bigint[], any[]];
    ids.forEach((id, index) => {
      ownedCreatures.push({
        id: id,
        speciesId: stats[index].speciesId,
        level: stats[index].level,
        ivs: [...stats[index].ivs],
        heldItemIds: [...stats[index].heldItemIds]
      });
    });
  }

  return { ownedCreatures, isPending, refetch };
}