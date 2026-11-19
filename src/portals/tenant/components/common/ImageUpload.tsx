import React, { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-bootstrap/Modal";
import { getCroppedImg } from "../../../shared/utils/media/canvasUtils";

interface ImageUploadProps {
  onImage?: (croppedImage: string | null, imageObject: File | null) => void;
  defaultImage?: string;
}

export default function ImageUpload({ onImage, defaultImage }: ImageUploadProps) {
  const [width, setWidth] = useState<number>(600);
  const [height, setHeight] = useState<number>(300);
  const [modalShow, setModalShow] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64, setBase64] = useState<string>("");
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hover, setHover] = useState<boolean>(false);
  
  const [customWidth, setCustomWidth] = useState<number>(600);
  const [customHeight, setCustomHeight] = useState<number>(300);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(4 / 3);
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  // Fonction pour nettoyer le base64 (enlever le préfixe)
  const cleanBase64String = (base64String: string): string => {
    if (!base64String || typeof base64String !== 'string') return '';
    if (!base64String.includes(',')) return base64String;
    const arr = base64String.split(',');
    return arr.length > 1 ? arr[1] : base64String;
  };

  // Fonction pour compresser l'image
  const compressImage = (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (file.size <= maxSizeMB * 1024 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions pour réduire la taille
          const maxDimension = 1920;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compresser avec qualité ajustable
          let quality = 0.9;
          let compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          
          // Réduire progressivement la qualité jusqu'à atteindre la taille souhaitée
          while (compressedDataUrl.length > maxSizeMB * 1024 * 1024 * 1.3 && quality > 0.1) {
            quality -= 0.05;
            compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          // Convertir en File
          const arr = compressedDataUrl.split(",");
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const bstr = atob(arr[arr.length - 1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const compressedFile = new File([u8arr], file.name.replace(/\.[^.]+$/, ".jpg"), { type: mime });
          resolve(compressedFile);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  useEffect(() => {
    setBase64(defaultImage || "");
  }, [defaultImage]);

  const handleDimensionChange = (type: 'width' | 'height', value: number) => {
    if (type === 'width') {
      setCustomWidth(value);
      if (lockAspect && aspectRatio) {
        setCustomHeight(Math.round(value / aspectRatio));
      }
    } else {
      setCustomHeight(value);
      if (lockAspect && aspectRatio) {
        setCustomWidth(Math.round(value * aspectRatio));
      }
    }
  };

  const applyCustomDimensions = () => {
    setWidth(customWidth);
    setHeight(customHeight);
  };

  const apply = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      if (!croppedImage) {
        console.error("L'image recadrée est indéfinie.");
        return;
      }
  
      const arr = croppedImage.split(",");
      
      if (!arr || arr.length < 2) {
        console.error("Erreur lors de la séparation de l'image.");
        return;
      }
  
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        console.error("Impossible d'extraire le type MIME.");
        return;
      }
  
      const mime = mimeMatch[1];
      const bstr = atob(arr[arr.length - 1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1] || 'png';
      const imageObject = new File([u8arr], `logo.${extension}`, { type: mime });
  
      // ICI : on nettoie le base64 avant de l'envoyer
      const cleanedBase64 = cleanBase64String(croppedImage);
      
      setBase64(croppedImage);
      
      // Envoyer le base64 nettoyé comme premier paramètre
      if (onImage) onImage(cleanedBase64, imageObject);
    } catch (e) {
      console.error("Erreur lors de la création de l'image recadrée :", e);
    }
    setModalShow(false);
  };

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("L'image sélectionnée est trop volumineuse. Veuillez choisir une image de moins de 10 Mo.");
      return;
    }

    try {
      // Compresser l'image si elle dépasse 1 Mo
      const compressedFile = await compressImage(file, 1);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setModalShow(true);
      };
    } catch (error) {
      console.error("Erreur lors de la compression de l'image :", error);
      alert("Erreur lors du traitement de l'image. Veuillez réessayer.");
    }
  };

  const imageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleRemoveImage = () => {
    setBase64("");
    setSelectedImage(null);
    if (onImage) onImage(null, null);
  };

  const handlePaysage = () => {
    setCustomWidth(500);
    setCustomHeight(500);
    setWidth(500);
    setHeight(500);
    setAspectRatio(1);
  };
  
  const handleBanner = () => {
    setCustomWidth(1200);
    setCustomHeight(200);
    setWidth(1200);
    setHeight(200);
    setAspectRatio(6);
  };

  const handlePortrait = () => {
    setCustomWidth(600);
    setCustomHeight(300);
    setWidth(600);
    setHeight(300);
    setAspectRatio(2);
  };

  const handleFreeRatio = () => {
    setAspectRatio(undefined);
    setLockAspect(false);
  };

  return (
    <>
      <div
        style={{
          padding: "20px 30px",
          border: isDragging ? "2px dashed #007bff" : "2px dashed #ccc",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginBottom: "10px",
          backgroundColor: isDragging || hover ? "#ccc" : "#fff",
          position: "relative",
        }}
        onClick={() => document.getElementById("input-file")?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onMouseOver={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {base64 ? (
          <>
            <img className="w-50" src={base64} alt="" />
            {hover && selectedImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                }}
                title="Supprimer l'image"
              >
                ×
              </button>
            )}
          </>
        ) : (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            Glissez-déposez ou cliquez pour ajouter une image
          </p>
        )}
      </div>

      <input type="file" id="input-file" style={{ display: "none" }} onChange={imageHandler} />

      <Modal show={modalShow} onHide={() => setModalShow(false)} backdrop="static" keyboard={false} fullscreen={true}>
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button onClick={apply} className="btn btn-primary">Croper</button>
              
              <div className="d-flex align-items-center ms-3">
                <input
                  type="number"
                  className="form-control form-control-sm mx-1"
                  style={{ width: '80px' }}
                  value={customWidth}
                  onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                  placeholder="Larg."
                  min="10"
                />
                <span>x</span>
                <input
                  type="number"
                  className="form-control form-control-sm mx-1"
                  style={{ width: '80px' }}
                  value={customHeight}
                  onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                  placeholder="Haut."
                  min="10"
                />
                <button 
                  className="btn btn-sm btn-outline-secondary mx-1"
                  onClick={applyCustomDimensions}
                  title="Appliquer les dimensions"
                >
                  ✓
                </button>
              </div>

              <div className="btn-group ms-2" role="group">
                <button 
                  className={`btn btn-sm ${lockAspect ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setLockAspect(true)}
                >
                  Ratio verrouillé
                </button>
                <button 
                  className={`btn btn-sm ${!lockAspect ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={handleFreeRatio}
                >
                  Ratio libre
                </button>
              </div>

              <div className="btn-group ms-2" role="group">
                <button onClick={handlePortrait} className="btn btn-outline-primary btn-sm">
                  Portrait
                </button>
                <button onClick={handlePaysage} className="btn btn-outline-primary btn-sm">
                  Paysage
                </button>
                <button onClick={handleBanner} className="btn btn-outline-primary btn-sm">
                  Banner
                </button>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="container" style={{ height: '70vh', position: 'relative' }}>
            <Cropper
              image={selectedImage || ""}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropSize={{ width, height }}
              showGrid={true}
              {...(aspectRatio === undefined && { cropShape: 'rect' })}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}