import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface MusicMapping {
  key: string;
  fileName?: string;
  fileDataUrl?: string;
}

@Component({
  selector: 'app-music-settings-dialog',
  templateUrl: './music-settings-dialog.component.html',
  styleUrls: ['./music-settings-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class MusicSettingsDialogComponent {
  mappings: MusicMapping[] = [];

  constructor(
    public dialogRef: MatDialogRef<MusicSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { settings: { mappings?: MusicMapping[] } }
  ) {
    // Initialize mappings from settings or default to empty array
    this.mappings = data.settings.mappings ? [...data.settings.mappings] : [];
  }

  addMapping() {
    this.mappings.push({ key: '' });
  }

  removeMapping(index: number) {
    this.mappings.splice(index, 1);
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.mappings[index].fileDataUrl = reader.result as string;
        this.mappings[index].fileName = file.name;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    this.dialogRef.close({ mappings: this.mappings });
  }
}
