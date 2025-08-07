import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Smartphone, QrCode } from "lucide-react";

interface WhatsAppStatusProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  phoneNumber?: string;
  lastSync?: string;
  isConnecting?: boolean;
}

export function WhatsAppStatus({ onConnect, onDisconnect }: WhatsAppStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Poll for status updates
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        const statusData = await response.json();
        setStatus(statusData);

        // If connecting, check for QR code
        if (statusData.isConnecting && !statusData.isConnected) {
          const qrResponse = await fetch('/api/whatsapp/qr');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCode(qrData.qrCode);
          }
        } else {
          setQrCode(null);
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
      });
      
      if (response.ok) {
        onConnect?.();
      } else {
        const error = await response.json();
        console.error('Connection failed:', error);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus({ isConnected: false });
        setQrCode(null);
        onDisconnect?.();
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const getStatusBadge = () => {
    if (status.isConnecting || isLoading) {
      return (
        <Badge variant="outline" className="bg-fpv-warning/10 text-fpv-warning border-fpv-warning/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting...
        </Badge>
      );
    }
    
    if (status.isConnected) {
      return (
        <Badge variant="outline" className="bg-fpv-success/10 text-fpv-success border-fpv-success/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        <XCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp Connection</CardTitle>
              <CardDescription>
                {status.isConnected && status.phoneNumber ? 
                  `Connected as ${status.phoneNumber}` : 
                  "Connect your WhatsApp account"}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!status.isConnected && !status.isConnecting && !isLoading && (
          <div className="text-center space-y-4 py-6">
            <QrCode className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-2">Connect WhatsApp Web</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click connect to generate a QR code that you can scan with your WhatsApp mobile app
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isLoading}
                className="bg-fpv-blue hover:bg-fpv-blue/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Connect WhatsApp
              </Button>
            </div>
          </div>
        )}

        {(status.isConnecting || qrCode) && !status.isConnected && (
          <div className="text-center space-y-4 py-6">
            {qrCode ? (
              <div className="space-y-4">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 mx-auto border-2 border-fpv-blue/20 rounded-lg"
                />
                <div>
                  <h3 className="font-semibold mb-2">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 mx-auto text-fpv-blue animate-spin" />
                <div>
                  <h3 className="font-semibold mb-2">Generating QR Code...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we prepare your connection
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {status.isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-fpv-success/5 rounded-lg border border-fpv-success/20">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-fpv-success" />
                <div>
                  <p className="font-medium">Successfully Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Your WhatsApp account is linked and ready to scan groups
                  </p>
                  {status.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {new Date(status.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              Disconnect WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
