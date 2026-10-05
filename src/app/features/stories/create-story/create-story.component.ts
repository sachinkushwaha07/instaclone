import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostsApi } from '../../../data-access/posts/posts.api';
import { StoriesApi } from '../../../data-access/stories/stories.api';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-create-story',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-story.component.html',
  styleUrl: './create-story.component.scss',
})
export class CreateStoryComponent {
  private readonly posts = inject(PostsApi);
  private readonly stories = inject(StoriesApi);
  private readonly router = inject(Router);

  protected readonly fileName = signal<string | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private file: File | null = null;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextFile = input.files?.[0] ?? null;
    this.previewUrl.set(null);
    this.file = nextFile;
    this.fileName.set(nextFile?.name ?? null);
    if (nextFile?.type.startsWith('image/')) this.previewUrl.set(URL.createObjectURL(nextFile));
  }

  async share(): Promise<void> {
    if (!this.file) return;
    this.uploading.set(true);
    this.errorMessage.set(null);
    try {
      const { uploadUrl, key } = await firstValueFrom(this.posts.requestUploadUrl(this.file.name, this.file.type));
      await firstValueFrom(this.posts.upload(uploadUrl, this.file));
      await firstValueFrom(this.stories.create({ mediaKey: key, kind: this.file.type.startsWith('video/') ? 'video' : 'image' }));
      await this.router.navigateByUrl('/');
    } catch {
      this.errorMessage.set('Your story could not be uploaded. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }
}
