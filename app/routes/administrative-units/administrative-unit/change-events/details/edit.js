import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { CHANGE_EVENT_TYPE } from 'frontend-organization-portal/models/change-event-type';
import { createValidatedChangeset } from 'frontend-organization-portal/utils/changeset';
import {
  changeEventValidations,
  decisionValidations,
} from 'frontend-organization-portal/validations/change-event';

export default class AdministrativeUnitsAdministrativeUnitChangeEventsDetailsEditRoute extends Route {
  @service currentSession;
  @service router;
  @service store;

  beforeModel() {
    if (!this.currentSession.canEdit) {
      this.router.transitionTo('route-not-found', {
        wildcard: 'pagina-niet-gevonden',
      });
    }
  }

  async model() {
    let { changeEvent, administrativeUnit, ...detailsPageModel } =
      this.modelFor(
        'administrative-units.administrative-unit.change-events.details'
      );

    let changeEventType = await changeEvent.type;
    let canAddDecisionInformation =
      changeEventType.id !== CHANGE_EVENT_TYPE.RECOGNITION_REQUESTED;

    let model = {
      administrativeUnit,
      ...detailsPageModel,
      changeEvent: createValidatedChangeset(
        changeEvent,
        changeEventValidations
      ),
      canAddDecisionInformation,
    };

    if (canAddDecisionInformation) {
      let decision = await changeEvent.decision;
      let decisionActivity = null;
      if (decision) {
        decisionActivity = await decision.hasDecisionActivity;
      }

      if (!decision) {
        decision = this.store.createRecord('decision');
      }

      if (!decisionActivity) {
        decisionActivity = this.store.createRecord('decisionActivity');
      }

      model.decision = createValidatedChangeset(decision, decisionValidations);
      model.decisionActivity = decisionActivity;
    }

    return model;
  }
}
