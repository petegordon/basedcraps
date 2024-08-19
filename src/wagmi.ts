import { http, cookieStorage, createConfig, createStorage, webSocket } from 'wagmi'
import { mainnet, sepolia, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    //chains: [mainnet, sepolia, baseSepolia],
    chains: [baseSepolia],
    connectors: [
      injected(),
      coinbaseWallet(),
      //walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      //[mainnet.id]: http(),
      //[sepolia.id]: http(),
      [baseSepolia.id]: webSocket(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    },    
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
