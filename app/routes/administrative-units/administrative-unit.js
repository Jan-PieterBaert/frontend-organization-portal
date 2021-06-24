import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default class AdministrativeUnitsAdministrativeUnitRoute extends Route {
  async model(params) {
    return hash({
      administrativeUnit: this.store.findRecord(
        'administrative-unit',
        params.id
      ),
      honoraryServiceTypes: this.store.findAll('honorary-service-type'),
      statuses: this.store.findAll('organization-status-code'),
      provinces: this.store
        .query('location', {
          filter: {
            level: 'Provincie',
          },
        })
        .then(function (provinces) {
          return provinces.mapBy('label');
        }),
      municipalities: this.store
        .query('location', {
          filter: {
            level: 'Gemeente',
          },
          page: {
            size: 400,
          },
        })
        .then(function (municipalities) {
          return municipalities.mapBy('label');
        }),
    });
  }
}
