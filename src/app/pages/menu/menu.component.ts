import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  imports: [CommonModule], //Para poder usar ngClass
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  //---------------------------SideBar-------------------------------------
  //Estado de sidebar
  sidebarVisible: boolean = true;

  //mostrar y/u ocultar barra lateral
  toggleSidebar(): void{
    this.sidebarVisible = !this.sidebarVisible; //se invierte el valor booleano actual
  }

  //getter para el icono del toggle
  // muestra el icono ☰ si esta visible y 👤 si esta oculto
  get toggleIcon(): string{
    return this.sidebarVisible ? '☰' : '👤';
  }

  //getter para el titulo del btn toggle
  //muestra el texto en el boton "ocultar perfil" o "mostrar perfil" dependiendo dl caso
  get toggleTitle(): string {
    return this.sidebarVisible ? 'Ocultar perfil' : 'Mostrar perfil';
  }

  //Getter para las clases CSS de la sidebar
  //devuelve las clases css para  sidebar normal
  get sidebarClasses(): string {
    return this.sidebarVisible ? 'sidebar' : 'sidebar hidden';
  }

  //Getter para las clases CSS del contenido principal
  get mainContentClasses(): string {
    return this.sidebarVisible ? 'main-content' : 'main-content expanded';
  }

  //Getter para las clases CSS del botón toggle
  get toggleButtonClasses(): string {
    return this.sidebarVisible ? 'toggle-sidebar' : 'toggle-sidebar sidebar-hidden';
  }

  //-----------------------------Foto-------------------------------------
  
  // Estado del modal de foto
  photoModalVisible: boolean = false;
  
  // Estado del modal de cámara
  cameraModalVisible: boolean = false;
  
  // URL de la imagen de perfil (null si no hay imagen)
  profileImageUrl: string | null = null;
  
  // Iniciales del usuario (se muestran cuando no hay foto)
  userInitials: string = 'AB';

  // Stream de video de la cámara
  currentStream: MediaStream | null = null;

  // Abrir modal para seleccionar foto
  openPhotoModal(): void {
    this.photoModalVisible = true;
  }

  // Cerrar modal de foto
  closePhotoModal(): void {
    this.photoModalVisible = false;
  }

  // MÉTODO CORREGIDO - Activar cámara real (para tomar foto)
  async takePhoto(): Promise<void> {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta acceso a la cámara');
        return;
      }

      this.closePhotoModal();
      
      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Cámara frontal por defecto
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Crear y mostrar el modal de cámara
      this.showCameraModal(stream);
      
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      
      // Manejo de errores específicos
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Acceso a la cámara denegado. Por favor permite el acceso y vuelve a intentar.');
        } else if (error.name === 'NotFoundError') {
          alert('No se encontró ninguna cámara en tu dispositivo.');
        } else if (error.name === 'NotReadableError') {
          alert('La cámara está siendo usada por otra aplicación.');
        } else {
          alert('Error al acceder a la cámara: ' + error.message);
        }
      }
    }
  }

  // Activar input de archivo (para subir desde galería)
  uploadPhoto(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
    this.closePhotoModal();
  }

  // Manejar la subida de foto (desde cámara o archivo)
  handlePhotoUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Verificar que sea una imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          // Guardar la URL de la imagen
          this.profileImageUrl = e.target?.result as string;
        };
        
        reader.readAsDataURL(file);
      } else {
        alert('Por favor selecciona un archivo de imagen válido');
      }
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    target.value = '';
  }

  // Eliminar foto de perfil (volver a mostrar iniciales)
  removePhoto(): void {
    this.profileImageUrl = null;
    this.closePhotoModal();
  }

  // Getter para verificar si hay foto de perfil
  get hasProfileImage(): boolean {
    return this.profileImageUrl !== null;
  }

  // Método para manejar clics fuera del modal (cerrar modal)
  onModalBackdropClick(event: Event): void {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido del modal
    if (event.target === event.currentTarget) {
      this.closePhotoModal();
    }
  }

  // Método para manejar clics fuera del modal de cámara
  onCameraBackdropClick(event: Event): void {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido del modal
    if (event.target === event.currentTarget) {
      this.closeCameraModal();
    }
  }

  // Mostrar modal de cámara
  showCameraModal(stream: MediaStream): void {
    this.currentStream = stream;
    this.cameraModalVisible = true;
    
    // Esperar a que el modal se renderice
    setTimeout(() => {
      const video = document.getElementById('cameraVideo') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    }, 100);
  }

  // Cerrar modal de cámara y detener stream
  closeCameraModal(): void {
    this.cameraModalVisible = false;
    
    // Detener el stream de video
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  // Capturar foto desde el video
  capturePhoto(): void {
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    const canvas = document.getElementById('photoCanvas') as HTMLCanvasElement;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        // Configurar el tamaño del canvas igual al video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0);
        
        // Convertir a imagen base64
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Guardar la foto
        this.profileImageUrl = photoDataUrl;
        
        // Cerrar modal de cámara
        this.closeCameraModal();
      }
    }
  }

  // Cambiar entre cámara frontal y trasera (móvil)
  async switchCamera(): Promise<void> {
    if (this.currentStream) {
      // Detener stream actual
      this.currentStream.getTracks().forEach(track => track.stop());
      
      try {
        // Alternar entre front y back camera
        const currentFacingMode = this.currentStream.getVideoTracks()[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        this.currentStream = newStream;
        
        const video = document.getElementById('cameraVideo') as HTMLVideoElement;
        if (video) {
          video.srcObject = newStream;
        }
        
      } catch (error) {
        console.error('Error al cambiar cámara:', error);
        alert('No se pudo cambiar la cámara');
      }
    }
  }

  //-----------------------------Servicios y Búsquedas-------------------------------------
  
  // Función para buscar servicios
  buscarServicio(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      const query = searchInput.value.trim();
      
      if (query) {
        console.log('Buscando:', query);
        // Aquí agregarías la lógica de búsqueda
        // Por ejemplo: this.router.navigate(['/buscar'], { queryParams: { q: query } });
      } else {
        alert('Por favor ingresa un término de búsqueda');
      }
    }
  }

  // Función para seleccionar un servicio
  seleccionarServicio(servicio: string): void {
    console.log('Servicio seleccionado:', servicio);
    // Aquí agregarías la lógica para manejar la selección de servicio
    // Por ejemplo: this.router.navigate(['/servicio', servicio]);
  }

  // Función para búsquedas recientes
  buscarReciente(termino: string): void {
    console.log('Búsqueda reciente:', termino);
    // Aquí agregarías la lógica para las búsquedas recientes
    // Por ejemplo: realizar la búsqueda automáticamente
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = termino;
      this.buscarServicio();
    }
  }
}