import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  users = [
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '123-456-7890',
      role: 'user',
      status: 'active',
      lastActive: '2024-05-20 12:34:56',
      dateJoined: '2023-01-15',
    },
    {
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      phone: '987-654-3210',
      role: 'admin',
      status: 'inactive',
      lastActive: '2024-05-18 09:12:34',
      dateJoined: '2022-11-20',
    },
  ];

  getRoleClass(user: any) {
    if (user.role === 'admin') {
      return ' bg-blue-50 text-blue-700 py-0.5 px-2.5 rounded-full border border-blue-200';
    }
    if (user.role === 'user') {
      return 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
    }
    if (user.role === 'agent') {
      return 'bg-yellow-50 text-yellow-700 py-0.5 px-2.5 rounded-full border border-yellow-200';
    }
    return '';
  }

  getStatusClass(user: any) {
    if (user.status === 'active') {
      return 'bg-green-50 text-green-700 py-0.5 px-2.5 rounded-full border border-green-200';
    }
    if (user.status === 'inactive') {
      return 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
    }
    return '';
  }
}
