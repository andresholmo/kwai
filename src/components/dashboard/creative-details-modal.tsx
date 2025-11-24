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

export function CreativeDetailsModal({
  creative,
  open,
  onClose,
}: CreativeDetailsModalProps) {
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
      default:
        return <Badge variant="secondary">Pausado</Badge>;
    }
  };

  // Extrair informações do criativo - tenta múltiplos campos
  const creativeName =
    creative.creativeName ||
    creative.name ||
    creative.creative_name ||
    `Criativo ${creative.creativeId || creative.id || "N/A"}`;
  const creativeId = creative.creativeId || creative.id || creative.creative_id;
  const status = creative.status || creative.openStatus || creative.open_status || 1;
  const materialType = creative.materialType || creative.material_type || 1;
  const actionUrl =
    creative.actionUrl ||
    creative.action_url ||
    creative.landingPageUrl ||
    creative.landing_page_url ||
    creative.websiteUrl ||
    creative.website_url ||
    "";
  const description =
    creative.description || creative.desc || creative.creative_desc || "";
  const coverUrl =
    creative.coverUrl ||
    creative.cover_url ||
    creative.thumbnailUrl ||
    creative.thumbnail_url ||
    creative.imageUrl ||
    creative.image_url ||
    "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Criativo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={creativeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : materialType === 1 ? (
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
              <p className="font-medium">{creativeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(status)}
            </div>
            <div>
              <p className="text-sm text-gray-500">ID do Criativo</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {creativeId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(String(creativeId))}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <Badge variant="outline">
                {materialType === 1 ? "Vídeo" : "Imagem"}
              </Badge>
            </div>
          </div>

          {/* URL de Destino */}
          <div>
            <p className="text-sm text-gray-500 mb-1">URL de Destino</p>
            {actionUrl ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm truncate flex-1">{actionUrl}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(actionUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(actionUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Não disponível</p>
            )}
          </div>

          {/* Descrição */}
          {description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Descrição</p>
              <p className="text-sm">{description}</p>
            </div>
          )}

          {/* Debug - Mostrar todos os campos disponíveis */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
              Ver dados brutos (debug)
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              {JSON.stringify(creative, null, 2)}
            </pre>
          </details>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {actionUrl && (
              <Button onClick={() => window.open(actionUrl, "_blank")}>
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
