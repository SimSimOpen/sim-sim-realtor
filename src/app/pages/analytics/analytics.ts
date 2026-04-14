import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  imports: [],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {
  analytics: any[] = [
    {
      property: 'Sunset Villa',
      type: 'Residential',
      occupancy: '85%',
      revenueYTD: '$120,000',
      trend: 'upward',
    },
    {
      property: 'Downtown Office',
      type: 'Commercial',
      occupancy: '70%',
      revenueYTD: '$200,000',
      trend: 'stable',
    },
  ];
}
