import { Component } from '@angular/core';
import { SidebarMenu } from '../../components/sidebar-menu/sidebar-menu';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-agent-main',
  imports: [SidebarMenu, RouterOutlet, Header],
  templateUrl: './agent-main.html',
  styleUrl: './agent-main.scss',
})
export class AgentMain {}
