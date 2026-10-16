import { Component } from '@angular/core';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-close-manually',
  imports: [TranslatePipe],
  templateUrl: './close-manually.html',
  styleUrl: './close-manually.scss',
})
export class CloseManually {}
