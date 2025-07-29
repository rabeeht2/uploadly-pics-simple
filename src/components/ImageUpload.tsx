import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export const ImageUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;

    try {
      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      const newImage: UploadedImage = {
        id: fileName,
        url: publicUrl,
        name: file.name,
      };

      setUploadedImages(prev => [newImage, ...prev]);
      
      toast({
        title: "Upload successful!",
        description: "Your image has been uploaded",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadImage);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadImage);
  };

  const removeImage = async (imageId: string) => {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([imageId]);

      if (error) throw error;

      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      toast({
        title: "Image deleted",
        description: "Image has been removed",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
          Uploadly
        </h1>
        <p className="text-muted-foreground">Simple image upload to Supabase</p>
      </div>

      {/* Upload Zone */}
      <Card
        className={`
          relative border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-primary bg-upload-zone-active/10 scale-105' 
            : 'border-border hover:border-primary/50 bg-upload-zone hover:bg-upload-zone-hover'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-12 text-center">
          <div className="mb-4">
            {uploading ? (
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`
                w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300
                ${isDragging ? 'bg-primary scale-110' : 'bg-muted'}
              `}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {uploading ? 'Uploading...' : 'Drop your images here'}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            or click to browse your files
          </p>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <Button disabled={uploading}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Images
          </Button>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Uploading your image...</span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Check className="w-6 h-6 text-success" />
            Uploaded Images ({uploadedImages.length})
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <Card key={image.id} className="group overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-muted-foreground truncate" title={image.name}>
                    {image.name}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};