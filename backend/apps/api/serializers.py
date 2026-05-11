from django.http import JsonResponse
from django.views import View
from django.db.models import Count, Sum, Q
from apps.web.models import *
from django.shortcuts import get_object_or_404
import calendar
import json


class MonthlyIncidentCountView(View):
    def get(self, request):
        incidents_by_month = Incidents.objects.extra(
            select={'month': "strftime('%%m', incident_date)", 'year': "strftime('%%Y', incident_date)"}
        ).values('month', 'year').annotate(
            incident_count=Count('id'),
            total_deaths=Sum('Incident_casualities__num_death'),
            total_injuries=Sum('Incident_casualities__num_injured'),
            infra_damage=Sum('Incident_casualities__infra_damage'),
            infra_destroyed=Sum('Incident_casualities__infra_destroyed'),
            child_total=Sum('Incident_casualities__child_total')
        ).order_by('year', 'month')

        formatted_response = {}
        for incident in incidents_by_month:
            year = incident['year']
            month_name = calendar.month_name[int(incident['month'])]
            if year not in formatted_response:
                formatted_response[year] = []
            formatted_response[year].append({
                'month': month_name,
                'incidents': incident['incident_count'],
                'total_deaths': incident['total_deaths'] or 0,
                'total_injuries': incident['total_injuries'] or 0,
                'infra_damage': incident['infra_damage'] or 0,
                'infra_destroyed': incident['infra_destroyed'] or 0,
                'child_total': incident['child_total'] or 0
            })

        response_list = [{'year': year, 'data': data} for year, data in formatted_response.items()]

        return JsonResponse(response_list, safe=False)


class IncidentsByCategoryViewList(View):
    def get(self, request, category_slug):
        category = get_object_or_404(Options, slug=category_slug, category=2)
        incidents = Incidents.objects.filter(category=category)

        data = []
        for incident in incidents:
            incident_data = {
                'id': incident.id,
                'incident_id': incident.incident_id,
                'incident_date': incident.incident_date,
                'description': incident.description,
                # Add other fields as needed
            }
            data.append(incident_data)

        return JsonResponse(data, safe=False)


class IncidentsByCategoryView(View):
    def get(self, request, category_slug):
        category = get_object_or_404(Options, slug=category_slug, category=2)
        incidents = Incidents.objects.filter(category=category)

        incidents_by_month = incidents.extra(
            select={'month': "strftime('%%m', incident_date)", 'year': "strftime('%%Y', incident_date)"}
        ).values('month', 'year').annotate(
            incident_count=Count('id'),
            total_deaths=Sum('Incident_casualities__num_death'),
            total_injuries=Sum('Incident_casualities__num_injured'),
            infra_damage=Sum('Incident_casualities__infra_damage'),
            infra_destroyed=Sum('Incident_casualities__infra_destroyed'),
            child_total=Sum('Incident_casualities__child_total')
        ).order_by('year', 'month')

        formatted_response = {}
        for incident in incidents_by_month:
            year = incident['year']
            month_name = calendar.month_name[int(incident['month'])]
            if year not in formatted_response:
                formatted_response[year] = []
            formatted_response[year].append({
                'month': month_name,
                'incidents': incident['incident_count'],
                'total_deaths': incident['total_deaths'] or 0,
                'total_injuries': incident['total_injuries'] or 0,
                'infra_damage': incident['infra_damage'] or 0,
                'infra_destroyed': incident['infra_destroyed'] or 0,
                'child_total': incident['child_total'] or 0
            })

        response_list = [{'year': year, 'data': data} for year, data in formatted_response.items()]

        return JsonResponse(response_list, safe=False)


class DataNameDetailView(View):
    def get(self, request, slug):
        data_name = get_object_or_404(DataName, slug=slug)
        values = data_name.datavalue_set.all()

        data = {
            'name': data_name.name,
            'category': str(data_name.category),
            'sumber': data_name.sumber,
            'keterangan': data_name.keterangan,
            'created_at': data_name.created_at,
            'updated_at': data_name.updated_at,
            'values': [
                {
                    'region': str(value.region),
                    'area_code': value.region.area_code,
                    'total_value': int(value.value) if value.value.is_integer() else value.value
                } for value in values
            ]
        }

        return JsonResponse(data)


class ProvincialIncidentCountView(View):
    def get(self, request):
        try:
            population_data_name = DataName.objects.get(pk=1)
            provinces = Regions.objects.filter(area_code__lt=100, area_code__gte=10)

            result = []
            for province in provinces:
                incident_count = self.count_incidents_recursive(province)

                try:
                    population = DataValue.objects.get(name=population_data_name, region=province).value
                except DataValue.DoesNotExist:
                    population = None

                if incident_count > 0 or population is not None:
                    result.append({
                        'province_name': province.name,
                        'province_area_code': province.area_code,
                        'incident_count': incident_count,
                        'population': population
                    })

            result.sort(key=lambda x: x['province_name'])

            return JsonResponse(result, safe=False)

        except DataName.DoesNotExist:
            return JsonResponse({"detail": "Population data configuration not found."}, status=404)
        except Exception as e:
            return JsonResponse({"detail": f"An unexpected error occurred: {str(e)}"}, status=500)

    def count_incidents_recursive(self, region):
        direct_count = Incidents.objects.filter(location=region).count()
        sub_provinces = region.sub_provinces.all()
        sub_count = sum(self.count_incidents_recursive(sub_province) for sub_province in sub_provinces)
        return direct_count + sub_count