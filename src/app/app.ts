import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationCenterComponent } from '../core/components/notification-center/notification-center.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NotificationCenterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
