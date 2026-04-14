import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-agents',
  imports: [CommonModule],
  templateUrl: './agents.html',
  styleUrl: './agents.scss',
})
export class Agents {
  agents = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      properties: 10,
      status: 'active',
      dateJoined: '2022-01-15',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '987-654-3210',
      properties: 8,
      status: 'inactive',
      dateJoined: '2023-03-22',
    },
  ];

  getStatusClass(agent: any) {
    if (agent.status === 'active') {
      return 'bg-green-50 text-green-700 py-0.5 px-2.5 rounded-full border border-green-200';
    }
    if (agent.status === 'inactive') {
      return 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
    }
    return '';
  }
}
