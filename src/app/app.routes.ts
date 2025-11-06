import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { MenuComponent } from './pages/menu/menu.component';
import { HomeComponent } from './pages/home/home.component';
import { RecuperarPassComponent } from './pages/recuperar-pass/recuperar-pass.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { RegistrarServicioComponent } from './pages/registrar-servicio/registrar-servicio.component';
import { HistorialSolicitudComponent } from './pages/historial-solicitud/historial-solicitud/historial-solicitud.component';
import { CalificacionesComponent } from './pages/Calificaciones/calificaciones/calificaciones.component';

export const routes: Routes = [
    {
        path:'',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'registro',
        component: RegistroComponent
    },
    {
        path: 'recuperar-pass',
        component: RecuperarPassComponent
    },
    {
        path: 'menu',
        component: MenuComponent
    },
    {
        path: 'perfil',
        component: PerfilComponent
    },
    {
        path: 'registrar-servicio',
        component: RegistrarServicioComponent
    },
    {
        path: 'historial-solicitud',
        component: HistorialSolicitudComponent
    },
    {
        path: 'calificaciones',
        component: CalificacionesComponent
    },
    {
        path: '**',
        component: LoginComponent
    },
];
