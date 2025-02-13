import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notepad',
  template: `
    <div class="notepad-container">
      <textarea 
        [(ngModel)]="content" 
        (ngModelChange)="onContentChange()"
        placeholder="Write your notes here..."
        class="notepad-textarea">
      </textarea>
    </div>
  `,
  styles: [`
    .notepad-container {
      width: 100%;
      height: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
    .notepad-textarea {
      width: 100%;
      height: 100%;
      resize: none;
      border: 1px solid #ccc;
      padding: 8px;
      box-sizing: border-box;
      font-family: inherit;
    }
  `],
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