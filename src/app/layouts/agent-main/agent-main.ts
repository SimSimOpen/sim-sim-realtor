import { Component } from '@angular/core';
import { SidebarMenu } from '../../components/sidebar-menu/sidebar-menu';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { SseService } from '../../shared/services/sse.service';

@Component({
  selector: 'app-agent-main',
  imports: [SidebarMenu, RouterOutlet, Header],
  templateUrl: './agent-main.html',
  styleUrl: './agent-main.scss',
})
export class AgentMain {
  constructor(private sseService: SseService) {}

  ngOnInit() {
    this.sseService.connect(); // Connect ONCE when app starts
  }

  ngOnDestroy() {
    this.sseService.disconnect(); // Disconnect when app closes
  }
}
