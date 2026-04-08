import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SseService } from '../../shared/services/sse.service';

@Component({
  selector: 'app-mobile',
  imports: [RouterOutlet],
  templateUrl: './mobile.html',
  styleUrl: './mobile.scss',
})
export class Mobile {}
