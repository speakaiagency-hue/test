import React from 'react';
import { ReferenceImage } from '../types';

interface ReferenceUploaderProps {
  images: ReferenceImage[];
  onAdd: (img: ReferenceImage) => void;
  onRemove: (id: string) => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ images, onAdd, onRemove }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (images.length >= 3) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(",")[1]; // separa só o base64 puro
        onAdd({
          id: crypto.randomUUID(),
          data: base64,
          mimeType: file.type,
          preview: dataUrl
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        Reference Images ({images.length}/3)
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            <img src={img.preview} alt="Reference" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(img.id)}
              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-slate-800">
            <i className="fas fa-plus text-slate-500 mb-2"></i>
            <span className="text-[10px] text-slate-400 font-medium">Add Image</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
            />
          </label>
        )}
      </div>

      <p className="text-[11px] text-slate-500 italic">
        Reference images help guide the AI's style, composition, or subject matter.
      </p>
    </div>
  );
};

export default ReferenceUploader;
