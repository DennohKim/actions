import { useEffect, useState } from 'react'
import { Action } from './Action'
import LentBalance from './LentBalance'
import ActivityLog from './ActivityLog'
import { WalletProviderDropdown } from './WalletProviderDropdown'
import type { WalletProviderConfig } from '@/constants/walletProviders'
import type { MarketPosition } from '@/types/market'
import { actionsApi } from '@/api/actionsApi'

export interface EarnContentProps {
  ready: boolean
  logout: () => Promise<void>
  walletAddress: string | null
  usdcBalance: string
  isLoadingBalance: boolean
  apy: number | null
  isLoadingApy: boolean
  depositedAmount: string | null
  isLoadingPosition: boolean
  isInitialLoad: boolean
  selectedProvider: WalletProviderConfig
  onMintUSDC: () => void
  onTransaction: (
    mode: 'lend' | 'withdraw',
    amount: number,
  ) => Promise<{
    transactionHash?: string
    blockExplorerUrl?: string
  }>
}

const NETWORK_LOGOS: Record<number, string> = {
  130: '/Optimism.svg', // Use Optimism logo as fallback for Unichain
  84532: '/base-logo.svg',
  11155420: '/Optimism.svg',
}

const ASSET_LOGOS: Record<string, string> = {
  USDC: '/usd-coin-usdc-logo.svg',
  USDC_DEMO: '/usd-coin-usdc-logo.svg',
  WETH: '/Optimism.svg', // Use Optimism logo as fallback for WETH
}

/**
 * Presentational component for the Earn page
 * Handles layout and user dropdown - all business logic delegated to container
 */
function Earn({
  ready,
  logout,
  walletAddress,
  usdcBalance,
  isLoadingBalance,
  selectedProvider,
  apy,
  isLoadingApy,
  depositedAmount,
  onMintUSDC,
  onTransaction,
}: EarnContentProps) {
  const [markets, setMarkets] = useState<MarketPosition[]>([])
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true)

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoadingMarkets(true)
        const markets = await actionsApi.getMarketsV1()

        const marketPositions: MarketPosition[] = markets.map((market: any) => ({
          marketName: market.name,
          marketLogo: market.name.toLowerCase().includes('aave') ? '/aave-logo-dark.svg' : '/morpho-logo.svg',
          networkName: market.marketId.chainId === 130 ? 'Unichain' :
                       market.marketId.chainId === 84532 ? 'Base Sepolia' :
                       market.marketId.chainId === 11155420 ? 'Optimism Sepolia' : 'Unknown',
          networkLogo: NETWORK_LOGOS[market.marketId.chainId] || '/base-logo.svg',
          assetSymbol: market.asset.metadata.symbol,
          assetLogo: ASSET_LOGOS[market.asset.metadata.symbol] || '/usd-coin-usdc-logo.svg',
          apy: market.apy.total,
          depositedAmount: null,
          isLoadingApy: false,
          isLoadingPosition: false,
          marketId: market.marketId,
          provider: market.name.toLowerCase().includes('aave') ? 'aave' : 'morpho',
        }))

        setMarkets(marketPositions)
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setIsLoadingMarkets(false)
      }
    }

    fetchMarkets()
  }, [])

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="text-center">
          <div className="text-lg" style={{ color: '#666666' }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Custom Header */}
      <header
        className="w-full"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E0E2EB',
        }}
      >
        <div className="w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/Optimism.svg" alt="Optimism" className="h-4" />
            </div>
            <div className="flex items-center gap-4">
              <WalletProviderDropdown
                selectedProvider={selectedProvider}
                walletAddress={walletAddress}
                onProviderSelect={async (providerConfig) => {
                  await logout()
                  window.location.href = `/earn?walletProvider=${providerConfig.queryParam}`
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Left Content Area */}
        <div
          className="flex-1 flex flex-col items-center p-8 overflow-y-auto"
          style={{ maxWidth: 'calc(100% - 436px)' }}
        >
          <div className="w-full max-w-2xl">
            {/* Title Section */}
            <div className="mb-8 text-left">
              <div className="flex items-center gap-2 mb-2">
                <h1
                  style={{
                    color: '#1a1b1e',
                    fontSize: '24px',
                    fontStyle: 'normal',
                    fontWeight: 600,
                  }}
                >
                  Actions Demo
                </h1>
                <span
                  className="px-2 py-2 text-xs font-medium rounded"
                  style={{
                    backgroundColor: '#F2F3F8',
                    color: '#404454',
                    fontSize: '14px',
                    fontWeight: 400,
                  }}
                >
                  Sandbox
                </span>
              </div>
              <p
                style={{
                  color: '#666666',
                  fontSize: '16px',
                }}
              >
                Earn interest by lending USDC
              </p>
            </div>

            <div className="space-y-6">
              <LentBalance
                markets={markets}
                isInitialLoad={isLoadingMarkets}
              />
              <Action
                usdcBalance={usdcBalance}
                isLoadingBalance={isLoadingBalance}
                apy={apy}
                isLoadingApy={isLoadingApy}
                depositedAmount={depositedAmount}
                onMintUSDC={onMintUSDC}
                onTransaction={onTransaction}
              />
            </div>
          </div>
        </div>

        {/* Activity Log - Right Side */}
        <div style={{ width: '436px' }}>
          <ActivityLog />
        </div>
      </main>
    </div>
  )
}

export default Earn
