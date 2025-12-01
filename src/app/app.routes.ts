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
import { DenunciasComponent } from './pages/denuncias/denuncias.component';
import { ServiciosGuardadosComponent } from './pages/servicios-guardados/servicios-guardados.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

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
        component: MenuComponent,
        canActivate: [authGuard] // 🔒 Si no hay token, lo patea al login
    },
    {
        path: 'perfil',
        component: PerfilComponent,
        canActivate: [authGuard] // 🔒 Si no hay token, lo patea al login
    },
    {
        path: 'perfil/:id',
        component: PerfilComponent,
        canActivate: [authGuard]
    },
    {
        path: 'registrar-servicio',
        component: RegistrarServicioComponent,
        canActivate: [authGuard] // 🔒 Si no hay token, lo patea al login
    },
    {
        path: 'historial-solicitud',
        component: HistorialSolicitudComponent,
        canActivate: [authGuard] // 🔒 Si no hay token, lo patea al login
    },
    {
        path: 'calificaciones',
        component: CalificacionesComponent,
        canActivate: [authGuard] // 🔒 Si no hay token, lo patea al login
    },
    {
        path: 'servicios-guardados',
        component: ServiciosGuardadosComponent,
        canActivate: [authGuard]
    },
    {
        path: 'denuncias',
        component: DenunciasComponent,
        canActivate: [adminGuard] 
    },
    {
        path: '**',
        component: LoginComponent
    },
];
