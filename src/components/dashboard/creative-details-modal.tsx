"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Image as ImageIcon, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreativeDetailsModalProps {
  creative: any;
  open: boolean;
  onClose: () => void;
}

export function CreativeDetailsModal({ creative, open, onClose }: CreativeDetailsModalProps) {
  const { toast } = useToast();

  if (!creative) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800">Em Revisão</Badge>;
      case 3:
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 0:
        return <Badge variant="secondary">Pausado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Criativo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {creative.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creative.coverUrl}
                alt={creative.creativeName}
                className="w-full h-full object-cover"
              />
            ) : creative.materialType === 1 ? (
              <div className="text-center">
                <Play className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Vídeo</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Imagem</p>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">
                {creative.creativeName || `Criativo ${creative.creativeId}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(creative.status || creative.openStatus)}
            </div>
            <div>
              <p className="text-sm text-gray-500">ID do Criativo</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {creative.creativeId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(creative.creativeId.toString())}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <Badge variant="outline">
                {creative.materialType === 1 ? "Vídeo" : "Imagem"}
              </Badge>
            </div>
          </div>

          {/* URL de Destino */}
          {creative.actionUrl && (
            <div>
              <p className="text-sm text-gray-500 mb-1">URL de Destino</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm truncate flex-1">{creative.actionUrl}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(creative.actionUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Descrição */}
          {creative.description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Descrição</p>
              <p className="text-sm">{creative.description}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {creative.actionUrl && (
              <Button onClick={() => window.open(creative.actionUrl, "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir URL
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

