"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AssetImage {
  id: string;
  url: string;
  fileName: string;
  createdAt: string;
}

interface AssetImagesDialogProps {
  assetId: string | null;
  assetLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetImagesDialog({
  assetId,
  assetLabel,
  open,
  onOpenChange,
}: AssetImagesDialogProps) {
  const [images, setImages] = useState<AssetImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    if (!assetId) return;
    const res = await fetch(`${API_URL}/api/assets/${assetId}/images`, {
      credentials: "include",
    });
    if (res.ok) setImages(await res.json());
  };

  useEffect(() => {
    if (open && assetId) loadImages();
    if (!open) setImages([]);
  }, [open, assetId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_URL}/api/assets/${assetId}/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast.success("Image uploaded");
      loadImages();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!assetId) return;
    const res = await fetch(`${API_URL}/api/assets/${assetId}/images/${imageId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Image deleted");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      toast.error("Failed to delete image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Images — {assetLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Image
            </Button>
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No images uploaded yet
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(img.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate px-2 py-1 bg-background">
                    {img.fileName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
