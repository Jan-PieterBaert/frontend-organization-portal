import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { trackedTask } from 'ember-resources/util/ember-concurrency';
import { CENTRAL_WORSHIP_SERVICE_BLACKLIST } from 'frontend-organization-portal/models/recognized-worship-type';
import { CLASSIFICATION_CODE } from 'frontend-organization-portal/models/administrative-unit-classification-code';

export default class ClassificationSelectComponent extends Component {
  @service store;
  @service currentSession;
  classifications = trackedTask(this, this.loadClassificationsTask, () => [
    this.args.selectedRecognizedWorshipTypeId,
  ]);

  get selectedClassification() {
    if (typeof this.args.selected === 'string') {
      return this.findClassificationById(this.args.selected);
    }

    return this.args.selected;
  }

  findClassificationById(id) {
    if (this.classifications.isRunning) {
      return null;
    }

    let classifications = this.classifications.value;
    return classifications.find((status) => status.id === id);
  }

  @task *loadClassificationsTask() {
    // Trick used to avoid infinite loop
    // See https://github.com/NullVoxPopuli/ember-resources/issues/340 for more details
    yield Promise.resolve();

    let allowedIds;

    let selectedRecognizedWorshipTypeId =
      this.args.selectedRecognizedWorshipTypeId;

    if (
      selectedRecognizedWorshipTypeId &&
      this.isIdInBlacklist(selectedRecognizedWorshipTypeId)
    ) {
      allowedIds = [CLASSIFICATION_CODE.WORSHIP_SERVICE];
    } else if (this.args.restrictForNewBestuursenheden) {
      allowedIds = [
        CLASSIFICATION_CODE.WORSHIP_SERVICE,
        CLASSIFICATION_CODE.CENTRAL_WORSHIP_SERVICE,
        CLASSIFICATION_CODE.DISTRICT,
        CLASSIFICATION_CODE.AGB,
        CLASSIFICATION_CODE.APB,
      ];
    } else {
      allowedIds = [
        CLASSIFICATION_CODE.WORSHIP_SERVICE,
        CLASSIFICATION_CODE.CENTRAL_WORSHIP_SERVICE,
        CLASSIFICATION_CODE.MUNICIPALITY,
        CLASSIFICATION_CODE.PROVINCE,
        CLASSIFICATION_CODE.OCMW,
        CLASSIFICATION_CODE.DISTRICT,
        CLASSIFICATION_CODE.AGB,
        CLASSIFICATION_CODE.APB,
      ];
    }

    if (this.currentSession.hasUnitRole) {
      allowedIds = allowedIds.filter(
        (id) =>
          ![
            CLASSIFICATION_CODE.WORSHIP_SERVICE,
            CLASSIFICATION_CODE.CENTRAL_WORSHIP_SERVICE,
          ].includes(id)
      );
    } else {
      allowedIds = [
        CLASSIFICATION_CODE.WORSHIP_SERVICE,
        CLASSIFICATION_CODE.CENTRAL_WORSHIP_SERVICE,
      ];
    }

    return yield this.store.query('administrative-unit-classification-code', {
      'filter[:id:]': allowedIds.join(),
      sort: 'label',
    });
  }

  isIdInBlacklist(id) {
    return CENTRAL_WORSHIP_SERVICE_BLACKLIST.find((element) => element == id);
  }
}
