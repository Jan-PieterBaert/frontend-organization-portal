import { isBlank } from '@ember/utils';
import { validatePresence } from 'ember-changeset-validations/validators';
import { ID_NAME } from 'frontend-organization-portal/models/identifier';
import { validateConditionally } from 'frontend-organization-portal/validators/validate-conditionally';
import { CLASSIFICATION_CODE } from 'frontend-organization-portal/models/administrative-unit-classification-code';

export default {
  name: validatePresence({
    presence: true,
    ignoreBlank: true,
    message: 'Vul de naam in',
  }),
  classification: validatePresence({
    presence: true,
    ignoreBlank: true,
    message: 'Selecteer een optie',
  }),
  recognizedWorshipType: validateConditionally(
    validatePresence({
      presence: true,
      ignoreBlank: true,
      message: 'Selecteer een optie',
    }),
    function (changes, content) {
      return isWorshipAdministrativeUnit(changes, content);
    }
  ),
  isAssociatedWith: validateConditionally(
    validatePresence({
      presence: true,
      ignoreBlank: true,
      message: 'Selecteer een optie',
    }),
    function (changes, content) {
      return (
        isWorshipAdministrativeUnit(changes, content) || isApb(changes, content)
      );
    }
  ),
  organizationStatus: validatePresence({
    presence: true,
    ignoreBlank: true,
    message: 'Selecteer een optie',
  }),
  wasFoundedByOrganization: validateConditionally(
    validatePresence({
      presence: true,
      ignoreBlank: true,
      message: 'Selecteer een optie',
    }),
    function (changes, content) {
      return (
        isMunicipality(changes, content) ||
        isAgb(changes, content) ||
        isApb(changes, content)
      );
    }
  ),
  isSubOrganizationOf: validateConditionally(
    validatePresence({
      presence: true,
      ignoreBlank: true,
      message: 'Selecteer een optie',
    }),
    function (changes, content) {
      return isAgb(changes, content) || isApb(changes, content);

      //todo this was disabled in OP-1705, as of today, this is not mandatory

      //const worshipService = isWorshipService(changes, content);
      //const worshipAdministrativeUnit = isWorshipAdministrativeUnit(
      //  changes,
      //  content
      //);
      // const province = isProvince(changes, content);

      // let unit = null;
      // if (changes.classification?.id && changes.recognizedWorshipType?.id) {
      //   unit = changes;
      // } else {
      //   unit = content;
      // }
      //
      // const typesThatHaveACentralWorshipService = [
      //   RECOGNIZED_WORSHIP_TYPE.ISLAMIC,
      //   RECOGNIZED_WORSHIP_TYPE.ROMAN_CATHOLIC,
      //   RECOGNIZED_WORSHIP_TYPE.ORTHODOX,
      // ];
      //
      // const requiresCentralWorshipService =
      //   typesThatHaveACentralWorshipService.find(
      //     (id) => id == unit.recognizedWorshipType?.get('id')
      //   );
      //
      // return (
      //   (!worshipAdministrativeUnit && !province) ||
      //   (worshipService && requiresCentralWorshipService)
      // );
    }
  ),
};

export function getStructuredIdentifierKBOValidations(store) {
  return {
    localId: validateKBO(store),
  };
}

// function isProvince(changes, content) {
//   return hasClassificationId(changes, content, CLASSIFICATION_CODE.PROVINCE);
// }

// function isWorshipService(changes, content) {
//   return hasClassificationId(
//     changes,
//     content,
//     CLASSIFICATION_CODE.WORSHIP_SERVICE
//   );
// }

function isMunicipality(changes, content) {
  return hasClassificationId(
    changes,
    content,
    CLASSIFICATION_CODE.MUNICIPALITY
  );
}
function isAgb(changes, content) {
  return hasClassificationId(changes, content, CLASSIFICATION_CODE.AGB);
}
function isApb(changes, content) {
  return hasClassificationId(changes, content, CLASSIFICATION_CODE.APB);
}
function isWorshipAdministrativeUnit(changes, content) {
  return (
    hasClassificationId(
      changes,
      content,
      CLASSIFICATION_CODE.CENTRAL_WORSHIP_SERVICE
    ) ||
    hasClassificationId(changes, content, CLASSIFICATION_CODE.WORSHIP_SERVICE)
  );
}

function hasClassificationId(changes, content, classificationId) {
  let unit = null;
  if (changes.classification?.id) {
    unit = changes;
  } else {
    unit = content;
  }

  return unit.classification?.get('id') === classificationId;
}

function validateKBO(store) {
  return async (key, newKboNumber, currentKboNumber) => {
    if (isBlank(newKboNumber)) {
      return true;
    }

    if (newKboNumber.match(/[^$,.\d]/) || newKboNumber.length !== 10) {
      return {
        message: 'Vul het (tiencijferige) KBO nummer in.',
      };
    }

    if (newKboNumber === currentKboNumber) {
      return true;
    }

    let records = await store.query('administrative-unit', {
      filter: {
        identifiers: {
          ':exact:id-name': ID_NAME.KBO,
          'structured-identifier': {
            ':exact:local-id': newKboNumber,
          },
        },
      },
      include: 'identifiers.structured-identifier',
    });

    if (records.length === 0) {
      return true;
    }

    // ember-changeset-validations doesn't support adding metadata to error messages
    // returning an object here seems to work so we use that as a workaround / hack
    return {
      message: 'Dit KBO-nummer behoort tot',
      meta: {
        administrativeUnit: records.firstObject,
      },
    };
  };
}
