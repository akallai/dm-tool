import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-notepad',
  template: `
    <textarea [(ngModel)]="content" (ngModelChange)="onContentChange()"
              placeholder="Write your notes here..." rows="10" cols="30"></textarea>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NotepadComponent implements OnInit {
  @Input() settings: any;
  content = '';

  ngOnInit() {
    this.content = this.settings?.content || '';
  }

  onContentChange() {
    if (this.settings) {
      this.settings.content = this.content;
    }
  }
}