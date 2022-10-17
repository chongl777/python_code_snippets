import { DialogComponent } from '@app/components/dialog-window/dialog.component';
import { Security } from '@app/models/security';

export interface SecLookupCompatibleComponent extends DialogComponent {
    setSecurity(security: Security): void;
}
