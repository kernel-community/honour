import { useCallback, useEffect, useState } from "react"
import { isAddress } from "viem"
import Blockies from "react-blockies"
import { useQuery } from "@tanstack/react-query"
import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"
import { InputBase } from "./InputBase"

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz")

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

/**
 * Address input with ENS name resolution
 */
export const AddressInput = ({ value, name, placeholder, onChange }) => {
  const [enteredEnsName, setEnteredEnsName] = useState();

  // Fetch ENS address from name
  const { data: ensAddress, isLoading: isEnsAddressLoading } = useQuery({
    queryKey: ['ensAddress', value],
    queryFn: async () => {
      if (!isENS(value)) return null
      try {
        return await publicClient.getEnsAddress({ name: value })
      } catch {
        return null
      }
    },
    enabled: isENS(value),
    staleTime: 30_000,
  });

  // Fetch ENS name from address
  const { data: ensName, isLoading: isEnsNameLoading } = useQuery({
    queryKey: ['ensName', value],
    queryFn: async () => {
      if (!isAddress(value)) return null
      try {
        return await publicClient.getEnsName({ address: value })
      } catch {
        return null
      }
    },
    enabled: isAddress(value),
    staleTime: 30_000,
  });

  // Fetch ENS avatar
  const { data: ensAvatar } = useQuery({
    queryKey: ['ensAvatar', value],
    queryFn: async () => {
      if (!isAddress(value)) return null
      try {
        return await publicClient.getEnsAvatar({ name: ensName || value })
      } catch {
        return null
      }
    },
    enabled: isAddress(value) && !!ensName,
    staleTime: 30_000,
  });

  // ens => address
  useEffect(() => {
    if (!ensAddress) return;

    // ENS resolved successfully
    setEnteredEnsName(value);
    onChange(ensAddress);
  }, [ensAddress, onChange, value]);

  const handleChange = useCallback(
    (newValue) => {
      setEnteredEnsName(undefined);
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <InputBase
      name={name}
      placeholder={placeholder}
      error={ensAddress === null}
      value={value}
      onChange={handleChange}
      disabled={isEnsAddressLoading || isEnsNameLoading}
      prefix={
        ensName && (
          <div className="flex bg-base-300 rounded-l-full items-center">
            {ensAvatar ? (
              <span className="w-[35px]">
                {
                  // eslint-disable-next-line
                  <img className="w-full rounded-full" src={ensAvatar} alt={`${ensAddress} avatar`} />
                }
              </span>
            ) : null}
            <span className="text-accent px-2">{enteredEnsName ?? ensName}</span>
          </div>
        )
      }
      suffix={value && <Blockies className="!rounded-full" seed={value?.toLowerCase()} size={7} scale={5} />}
    />
  );
};