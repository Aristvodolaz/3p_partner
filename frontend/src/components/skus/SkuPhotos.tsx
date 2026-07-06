import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { Sku } from '@/types/sku';
import { photoUrl } from '@/types/sku';
import { useAddSkuPhoto, useRemoveSkuPhoto } from '@/hooks/useSkus';

const MAX_PHOTOS = 3;

interface Props {
  sku: Sku;
}

export function SkuPhotos({ sku }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addPhoto = useAddSkuPhoto(sku.id);
  const removePhoto = useRemoveSkuPhoto(sku.id);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addPhoto.mutate(file);
    e.target.value = '';
  };

  return (
    <div>
      <label className="label">Фото товара ({sku.photos.length}/{MAX_PHOTOS})</label>
      <div className="flex gap-3 mt-1 flex-wrap">
        {sku.photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photoUrl(photo)}
              alt={sku.name}
              className="w-24 h-24 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removePhoto.mutate(photo.id)}
              disabled={removePhoto.isPending}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              title="Удалить фото"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {sku.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={addPhoto.isPending}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            <ImagePlus size={20} />
            <span className="text-[10px]">
              {addPhoto.isPending ? 'Загрузка...' : 'Добавить'}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
