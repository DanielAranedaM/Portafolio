import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { MenuComponent } from './pages/menu/menu.component';
import { HomeComponent } from './pages/home/home.component';
import { RecuperarPassComponent } from './pages/recuperar-pass/recuperar-pass.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

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
        path: '**',
        component: LoginComponent
    },
];
