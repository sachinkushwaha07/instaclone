import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostsApi } from '../../data-access/posts/posts.api';
import { ButtonComponent } from '../../shared/ui/button/button.component';

/**
 * Real implementation, when wired to a live backend:
 * 1. User picks a file -> compress/crop on a <canvas> client-side.
 * 2. requestUploadUrl() -> PUT the compressed file straight to object
 *    storage with HttpClient's reportProgress for a progress bar.
 * 3. create() with the returned media key + caption.
 * 4. Listen on the WebSocket for a "media.ready" event once transcoding
 *    finishes, and show a "processing" state on the new post until then.
 */
@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [ButtonComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss',
})
export class CreatePostComponent {
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);

  protected readonly fileName = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected caption = '';
  private file: File | null = null;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.fileName.set(this.file?.name ?? null);
  }

  async share(): Promise<void> {
    if (!this.file) return;
    this.uploading.set(true);
    this.errorMessage.set(null);
    try {
      const { uploadUrl, key } = await firstValueFrom(
        this.api.requestUploadUrl(this.file.name, this.file.type)
      );
      await firstValueFrom(this.api.upload(uploadUrl, this.file));
      const post = await firstValueFrom(this.api.create({ mediaKeys: [key], caption: this.caption }));
      this.router.navigate(['/p', post.id]);
    } catch {
      this.errorMessage.set('Your post could not be uploaded. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }
}
