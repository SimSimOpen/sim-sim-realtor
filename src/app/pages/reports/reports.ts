import { Component } from '@angular/core';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-reports',
  imports: [TranslatePipe],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
})
export class ReportsComponent {
  reports = [
    {
      name: 'Monthly Sales Report',
      type: 'Financial',
      generatedBy: 'Alice Johnson',
      dateGenerated: '2024-05-20 12:34:56',
      status: 'completed',
    },
    {
      name: 'Customer Feedback Report',
      type: 'Customer',
      generatedBy: 'Bob Smith',
      dateGenerated: '2024-05-18 09:12:34',
      status: 'in-progress',
    },
  ];
}
