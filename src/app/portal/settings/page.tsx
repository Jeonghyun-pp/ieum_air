'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePortal } from '@/contexts/PortalContext';
import { useAuth } from '@/contexts/AuthContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Link2, Unlink, CheckCircle2, AlertCircle, Instagram, BarChart3 } from 'lucide-react';

interface IntegrationInfo {
  id: string;
  platform: string;
  status: string;
  accountName?: string;
}

const platformConfig = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    description: '인스타그램 비즈니스 계정을 연결하면 팔로워, 인사이트 데이터를 자동으로 수집합니다.',
  },
  ga4: {
    name: 'Google Analytics 4',
    icon: BarChart3,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    description: 'GA4를 연결하면 웹사이트 트래픽, 전환 데이터를 포털에서 확인할 수 있습니다.',
  },
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { activeProperty, isLoading: portalLoading } = usePortal();
  const { firebaseUser } = useAuth();
  const searchParams = useSearchParams();

  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const successParam = searchParams.get('success');
  const errorParam = searchParams.get('error');

  // Fetch integrations
  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!firebaseUser || !activeProperty) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`/api/integrations?propertyId=${activeProperty.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setIntegrations(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch integrations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, [firebaseUser, activeProperty]);

  const handleConnect = async (platform: string) => {
    if (!firebaseUser || !activeProperty) return;

    setConnectingPlatform(platform);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/integrations/${platform}/authorize?propertyId=${activeProperty.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data.authUrl) {
        window.location.href = json.data.authUrl;
      }
    } catch (err) {
      console.error('Failed to start OAuth:', err);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!firebaseUser || !activeProperty) return;

    try {
      const token = await firebaseUser.getIdToken();
      await fetch(`/api/integrations?propertyId=${activeProperty.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });

      setIntegrations(prev => prev.map(i =>
        i.platform === platform ? { ...i, status: 'revoked' } : i
      ));
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  if (portalLoading || isLoading) {
    return <PortalSkeleton />;
  }

  const getIntegration = (platform: string) =>
    integrations.find(i => i.platform === platform && i.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">설정</h1>
        <p className="text-muted-foreground">외부 서비스 연동 및 계정 설정</p>
      </div>

      {/* Success/Error messages */}
      {successParam && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm">
            {successParam === 'instagram' ? 'Instagram이 성공적으로 연결되었습니다.' : 'Google Analytics가 성공적으로 연결되었습니다.'}
          </span>
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">연동 중 오류가 발생했습니다. 다시 시도해주세요.</span>
        </div>
      )}

      {/* Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">서비스 연동</h2>

        {Object.entries(platformConfig).map(([platform, config]) => {
          const integration = getIntegration(platform);
          const Icon = config.icon;
          const isConnected = !!integration;

          return (
            <div key={platform} className="p-6 rounded-2xl bg-dark-elevated">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{config.name}</h3>
                    {isConnected && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">
                        연결됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
                  {isConnected && integration.accountName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      계정: @{integration.accountName}
                    </p>
                  )}
                  <div className="flex gap-3">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        className="border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30"
                        onClick={() => handleDisconnect(platform)}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        연결 해제
                      </Button>
                    ) : (
                      <Button
                        variant="gradient"
                        onClick={() => handleConnect(platform)}
                        disabled={!!connectingPlatform}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {connectingPlatform === platform ? '연결 중...' : '연결하기'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
