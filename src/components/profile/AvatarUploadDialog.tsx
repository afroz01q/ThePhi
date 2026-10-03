import { useState, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  userId: string;
  onAvatarUpdated: (newUrl: string) => void;
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  userId,
  onAvatarUpdated,
}: AvatarUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directUrl, setDirectUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image if larger than 1MB (WebP format, max 1080p, quality 0.8)
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1080;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Compression conversion failed'));
              }
            },
            'image/webp',
            0.8
          );
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file format. Please upload JPEG, PNG, WEBP, GIF, or AVIF.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCompressionInfo(null);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Please choose an image file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      let uploadPayload: Blob | File = selectedFile;
      let fileExt = selectedFile.name.split('.').pop() || 'png';

      // Enforce 1MB limit with auto-compression
      const ONE_MB = 1024 * 1024;
      if (selectedFile.size > ONE_MB) {
        setUploadProgress(35);
        const compressedBlob = await compressImage(selectedFile);
        uploadPayload = compressedBlob;
        fileExt = 'webp';
        const finalKb = Math.round(compressedBlob.size / 1024);
        setCompressionInfo(`Image compressed automatically to WEBP (${finalKb} KB)`);
        toast.info(`Image automatically compressed to ${finalKb} KB for fast loading.`);
      }

      setUploadProgress(60);

      // Unique alphanumeric English filename
      const cleanFileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadPayload, {
          cacheControl: '3600',
          upsert: true,
          contentType: uploadPayload.type || `image/${fileExt}`,
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(85);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      setUploadProgress(100);
      toast.success('Profile picture updated successfully!');
      onAvatarUpdated(publicUrl);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDirectUrl = async () => {
    if (!directUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    setIsUploading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: directUrl.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Profile picture updated!');
      onAvatarUpdated(directUrl.trim());
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectUrl('');
    setUploadProgress(0);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetState(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Change Profile Picture
          </DialogTitle>
          <DialogDescription>
            Upload a photo from your computer or enter an image URL to customize your avatar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4 pt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="text-xs">
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> File Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Image URL
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FILE UPLOAD */}
          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group">
                <img
                  src={previewUrl || currentAvatarUrl || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-md"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {selectedFile ? 'Select Different Photo' : 'Select Photo from Computer'}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Supported: JPEG, PNG, WEBP, GIF, AVIF. Files &gt;1MB are automatically compressed.
              </p>

              {compressionInfo && (
                <div className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{compressionInfo}</span>
                </div>
              )}

              {isUploading && (
                <div className="w-full space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading profile photo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-primary text-primary-foreground font-semibold"
                disabled={!selectedFile || isUploading}
                onClick={handleUploadFile}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  'Save Profile Picture'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: DIRECT IMAGE URL */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-url-input">Direct Image URL</Label>
              <Input
                id="avatar-url-input"
                type="url"
                placeholder="https://example.com/my-photo.jpg"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Paste any publicly accessible image link (e.g. Unsplash, GitHub avatar, CDN).
              </p>
            </div>

            {directUrl && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                <img
                  src={directUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                  onError={() => toast.error('Could not load image from this URL')}
                />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Preview</p>
                  <p className="text-muted-foreground line-clamp-1">{directUrl}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-primary text-primary-foreground font-semibold"
                disabled={!directUrl.trim() || isUploading}
                onClick={handleSaveDirectUrl}
              >
                {isUploading ? 'Saving...' : 'Apply Image URL'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
