from django.http import JsonResponse
from django.views import View
from django.db.models import Count, Sum, Q, F, ExpressionWrapper, IntegerField
from django.db.models.functions import Extract
from apps.web.models import *
from django.shortcuts import get_object_or_404
import calendar
import json
from itertools import combinations

# Years to hide from public-facing analytics endpoints (insufficient/future data)
EXCLUDED_YEARS = {2026}


class MonthlyIncidentCountView(View):
    def get(self, request):
        incidents_by_month = (
            Incidents.objects
            .exclude(incident_date__year__in=EXCLUDED_YEARS)
            .annotate(
                month=Extract('incident_date', 'month'),
                year=Extract('incident_date', 'year')
            )
            .values('month', 'year')
            .annotate(
                incident_count=Count('id'),
                total_deaths=Sum('Incident_casualities__num_death'),
                total_injuries=Sum('Incident_casualities__num_injured'),
                female_deaths=Sum('Incident_casualities__female_death'),
                female_injuries=Sum('Incident_casualities__female_injured'),
                child_deaths=Sum('Incident_casualities__child_death'),
                child_injuries=Sum('Incident_casualities__child_injured'),
                infra_damage=Sum('Incident_casualities__infra_damage'),
                infra_destroyed=Sum('Incident_casualities__infra_destroyed')
            )
            .order_by('year', 'month')
        )

        formatted_response = {}
        for incident in incidents_by_month:
            year = incident['year']
            month_name = calendar.month_name[incident['month']]
            
            if year not in formatted_response:
                formatted_response[year] = []
                
            formatted_response[year].append({
                'month': month_name,
                'incidents': incident['incident_count'],
                'total_deaths': incident['total_deaths'] or 0,
                'total_injuries': incident['total_injuries'] or 0,
                'female_deaths': incident['female_deaths'] or 0,
                'female_injuries': incident['female_injuries'] or 0,
                'child_deaths': incident['child_deaths'] or 0,
                'child_injuries': incident['child_injuries'] or 0,
                'infra_damage': incident['infra_damage'] or 0,
                'infra_destroyed': incident['infra_destroyed'] or 0
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
                    incident_ratio = self.calculate_incident_ratio(incident_count, population)
                    result.append({
                        'province_name': province.name,
                        'province_area_code': province.area_code,
                        'incident_count': incident_count,
                        'population': population,
                        'incident_ratio': incident_ratio
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

    def calculate_incident_ratio(self, incident_count, population):
        if population is not None and population > 0:
            return round((incident_count / population) * 10000, 3)
        return None


class MonthlyIncidentCategoryView(View):
    def get(self, request):
        # Get all incident categories
        categories = Options.objects.filter(category__id=2).values_list('id', 'title')
        category_dict = {cat[0]: cat[1] for cat in categories}

        # Annotate with month and year
        incidents_by_month = (
            Incidents.objects
            .annotate(
                month=Extract('incident_date', 'month'),
                year=Extract('incident_date', 'year')
            )
            .values('month', 'year')
            .annotate(
                incident_count=Count('id')
            )
            .order_by('year', 'month')
        )

        formatted_response = {}
        
        # First, initialize the structure for all months
        for incident in incidents_by_month:
            year = str(incident['year'])
            month = incident['month']
            month_name = calendar.month_name[month]
            
            if year not in formatted_response:
                formatted_response[year] = []
            
            # Find or create month data
            month_data = next(
                (item for item in formatted_response[year] if item["month"] == month_name),
                None
            )
            
            if month_data is None:
                month_data = {
                    'month': month_name,
                    'incidents': incident['incident_count']
                }
                for cat_name in category_dict.values():
                    month_data[cat_name] = 0
                formatted_response[year].append(month_data)

        # Now count incidents by category for each month
        for cat_id, cat_name in category_dict.items():
            incidents_by_category = (
                Incidents.objects
                .filter(category=cat_id)
                .annotate(
                    month=Extract('incident_date', 'month'),
                    year=Extract('incident_date', 'year')
                )
                .values('month', 'year')
                .annotate(count=Count('id'))
                .order_by('year', 'month')
            )
            
            for incident in incidents_by_category:
                year = str(incident['year'])
                month = incident['month']
                month_name = calendar.month_name[month]
                
                # Find the corresponding month data
                month_data = next(
                    (item for item in formatted_response[year] if item["month"] == month_name),
                    None
                )
                
                if month_data:
                    month_data[cat_name] = incident['count']

        # Sort months for each year
        for year in formatted_response:
            formatted_response[year].sort(
                key=lambda x: list(calendar.month_name).index(x['month'])
            )

        # Convert to list format
        response_list = [
            {'year': year, 'data': data}
            for year, data in formatted_response.items()
        ]
        
        # Sort years in descending order
        response_list.sort(key=lambda x: x['year'], reverse=True)

        return JsonResponse(response_list, safe=False)


class RecentIncidentsView(View):
    def get(self, request):
        # Get the 10 most recent incidents (including unpublished ones)
        recent_incidents = Incidents.objects.order_by('-incident_date')[:10]
        
        data = []
        for incident in recent_incidents:
            # Get casualty data
            casualty = Casualities.objects.filter(incident=incident).first()
            
            # Get categories
            categories = [category.title for category in incident.category.all()]
            
            # Format the response
            incident_data = {
                'id': incident.id,
                'incident_id': incident.incident_id,
                'date': incident.incident_date.strftime('%Y-%m-%d'),
                'location': incident.location.name if incident.location else None,
                'province': incident.location.top_level_province.name if incident.location and hasattr(incident.location, 'top_level_province') and incident.location.top_level_province else None,
                'description': incident.description,
                'categories': categories,
                'deaths': casualty.num_death if casualty else 0,
                'injuries': casualty.num_injured if casualty else 0,
                'link': incident.link,
                'published': incident.publish
            }
            data.append(incident_data)
        
        return JsonResponse(data, safe=False)


class IncidentDetailView(View):
    def get(self, request, incident_id):
        try:
            incident = Incidents.objects.get(id=incident_id)
        except Incidents.DoesNotExist:
            return JsonResponse({'error': 'Incident not found'}, status=404)
        
        # Get casualty data
        casualty = Casualities.objects.filter(incident=incident).first()
        
        # Get violence data
        violence_data = Violence.objects.filter(incident=incident).values(
            'violence_form__title', 
            'weapon_type__title', 
            'issue_type__title'
        )
        
        # Get actor data
        actors = Actor.objects.filter(incident=incident).values(
            'actor__title',
            'actor_atribute__title',
            'minorities',
            'total_actor'
        )
        
        # Get intervention data
        interventions = Intervene.objects.filter(incident=incident).values(
            'intervene_actor__title',
            'intervene_actor_type__title',
            'result'
        )
        
        # Format the response
        data = {
            'id': incident.id,
            'incident_id': incident.incident_id,
            'date': incident.incident_date.strftime('%Y-%m-%d'),
            'location': {
                'id': incident.location.id if incident.location else None,
                'name': incident.location.name if incident.location else None,
                'province': incident.location.top_level_province.name if incident.location and hasattr(incident.location, 'top_level_province') and incident.location.top_level_province else None
            },
            'description': incident.description,
            'notes': incident.notes,
            'categories': [category.title for category in incident.category.all()],
            'casualties': {
                'deaths': casualty.num_death if casualty else 0,
                'injuries': casualty.num_injured if casualty else 0,
                'female_deaths': casualty.female_death if casualty else 0,
                'female_injuries': casualty.female_injured if casualty else 0,
                'child_deaths': casualty.child_death if casualty else 0,
                'child_injuries': casualty.child_injured if casualty else 0,
                'infrastructure_damaged': casualty.infra_damage if casualty else 0,
                'infrastructure_destroyed': casualty.infra_destroyed if casualty else 0
            },
            'violence': list(violence_data),
            'actors': list(actors),
            'interventions': list(interventions),
            'link': incident.link,
            'published': incident.publish,
            'created_at': incident.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': incident.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return JsonResponse(data)


class IncidentSummaryView(View):
    def get(self, request):
        # Get total counts
        total_incidents = Incidents.objects.count()
        
        # Get casualty totals
        casualty_totals = Casualities.objects.aggregate(
            total_deaths=Sum('num_death'),
            total_injuries=Sum('num_injured'),
            total_female_deaths=Sum('female_death'),
            total_female_injuries=Sum('female_injured'),
            total_child_deaths=Sum('child_death'),
            total_child_injuries=Sum('child_injured'),
            total_infra_damaged=Sum('infra_damage'),
            total_infra_destroyed=Sum('infra_destroyed')
        )
        
        # Get incidents by category
        categories = Options.objects.filter(category_id=2)
        category_counts = []
        
        for category in categories:
            count = Incidents.objects.filter(category=category).count()
            if count > 0:
                category_counts.append({
                    'category': category.title,
                    'count': count,
                    'percentage': round((count / total_incidents) * 100, 2) if total_incidents > 0 else 0
                })
        
        # Get incidents by province (top 5)
        provinces = Regions.objects.filter(parents=None)
        province_counts = []
        
        for province in provinces:
            # Count incidents in this province and its sub-regions
            count = self.count_incidents_recursive(province)
            if count > 0:
                province_counts.append({
                    'province': province.name,
                    'count': count
                })
        
        # Sort by count and get top 5
        province_counts = sorted(province_counts, key=lambda x: x['count'], reverse=True)[:5]
        
        # Format the response
        data = {
            'total_incidents': total_incidents,
            'casualties': {
                'deaths': casualty_totals['total_deaths'] or 0,
                'injuries': casualty_totals['total_injuries'] or 0,
                'female_deaths': casualty_totals['total_female_deaths'] or 0,
                'female_injuries': casualty_totals['total_female_injuries'] or 0,
                'child_deaths': casualty_totals['total_child_deaths'] or 0,
                'child_injuries': casualty_totals['total_child_injuries'] or 0,
                'infrastructure_damaged': casualty_totals['total_infra_damaged'] or 0,
                'infrastructure_destroyed': casualty_totals['total_infra_destroyed'] or 0
            },
            'incidents_by_category': category_counts,
            'top_provinces': province_counts
        }
        
        return JsonResponse(data)
    
    def count_incidents_recursive(self, region):
        # Count incidents directly in this region
        direct_count = Incidents.objects.filter(location=region).count()
        
        # Count incidents in sub-regions
        sub_regions = Regions.objects.filter(parents=region)
        sub_count = sum(self.count_incidents_recursive(sub) for sub in sub_regions)
        
        return direct_count + sub_count


class PublicationViewCountView(View):
    def post(self, request, publication_id):
        try:
            publication = Publications.objects.get(id=publication_id)
            publication.visitor_count += 1
            publication.save()
            return JsonResponse({
                'success': True,
                'new_count': publication.visitor_count
            })
        except Publications.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Publication not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


class PublicationDownloadCountView(View):
    def post(self, request, publication_id):
        try:
            publication = Publications.objects.get(id=publication_id)
            if not hasattr(publication, 'download_count'):
                # Add download_count field if it doesn't exist
                publication.download_count = 1
            else:
                publication.download_count += 1
            publication.save()
            return JsonResponse({
                'success': True,
                'new_count': publication.download_count
            })
        except Publications.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Publication not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

class ViolenceFormsAnalyticsView(View):
    def get(self, request):
        """
        API endpoint for violence forms analytics with monthly counts and Venn diagram support
        
        Query parameters:
        - year: Filter by specific year (optional)
        - format: 'monthly' (default) or 'venn' for Venn diagram data
        """
        year_param = request.GET.get('year')
        format_param = request.GET.get('format', 'monthly')
        
        # Base queryset for violence records
        violence_queryset = (
            Violence.objects
            .select_related('violence_form', 'incident')
            .exclude(incident__incident_date__year__in=EXCLUDED_YEARS)
        )

        if year_param:
            violence_queryset = violence_queryset.filter(incident__incident_date__year=year_param)
        
        if format_param == 'venn':
            return self.get_venn_diagram_data(violence_queryset)
        else:
            return self.get_monthly_data(violence_queryset, year_param)
    
    def get_monthly_data(self, violence_queryset, year_param):
        """Get violence forms count per month"""
        
        # Get all violence forms
        violence_forms = Options.objects.filter(category=5).values_list('id', 'title')
        form_dict = {form[0]: form[1] for form in violence_forms}
        
        # Get incidents with violence data by month
        monthly_data = (
            violence_queryset
            .annotate(
                month=Extract('incident__incident_date', 'month'),
                year=Extract('incident__incident_date', 'year')
            )
            .values('month', 'year', 'violence_form__id', 'violence_form__title')
            .annotate(count=Count('id'))
            .order_by('year', 'month', 'violence_form__title')
        )
        
        # Structure the response
        formatted_response = {}
        
        for item in monthly_data:
            year = str(item['year'])
            month = item['month']
            month_name = calendar.month_name[month]
            form_title = item['violence_form__title']
            count = item['count']
            
            if year not in formatted_response:
                formatted_response[year] = {}
            
            if month_name not in formatted_response[year]:
                formatted_response[year][month_name] = {
                    'month': month_name,
                    'month_number': month,
                    'total_incidents': 0,
                    'violence_forms': {}
                }
            
            formatted_response[year][month_name]['violence_forms'][form_title] = count
        
        # Calculate totals and add missing forms
        for year in formatted_response:
            for month_name in formatted_response[year]:
                month_data = formatted_response[year][month_name]
                
                # Add missing violence forms with 0 count
                for form_id, form_title in form_dict.items():
                    if form_title not in month_data['violence_forms']:
                        month_data['violence_forms'][form_title] = 0
                
                # Calculate total incidents for this month (avoiding double counting)
                month_incidents = set()
                monthly_violence = violence_queryset.filter(
                    incident__incident_date__month=month_data['month_number'],
                    incident__incident_date__year=int(year)
                )
                for v in monthly_violence:
                    month_incidents.add(v.incident.id)
                
                month_data['total_incidents'] = len(month_incidents)
        
        # Convert to list format and sort
        response_list = []
        for year, months in formatted_response.items():
            sorted_months = sorted(
                months.values(),
                key=lambda x: x['month_number']
            )
            response_list.append({
                'year': year,
                'months': sorted_months
            })
        
        response_list.sort(key=lambda x: x['year'], reverse=True)
        
        return JsonResponse({
            'format': 'monthly',
            'data': response_list
        })
    
    def get_venn_diagram_data(self, violence_queryset):
        """Get data for Venn diagrams showing overlapping violence forms"""
        
        # Get all incidents with their violence forms
        incidents_with_forms = {}
        
        for violence in violence_queryset.select_related('violence_form', 'incident'):
            incident_id = violence.incident.id
            form_title = violence.violence_form.title
            
            if incident_id not in incidents_with_forms:
                incidents_with_forms[incident_id] = {
                    'incident_id': violence.incident.incident_id,
                    'date': violence.incident.incident_date.strftime('%Y-%m-%d'),
                    'forms': []
                }
            
            incidents_with_forms[incident_id]['forms'].append(form_title)
        
        # Get all unique violence forms
        all_forms = set()
        for incident_data in incidents_with_forms.values():
            all_forms.update(incident_data['forms'])
        
        all_forms = sorted(list(all_forms))
        
        # Calculate individual form counts
        individual_counts = {}
        for form in all_forms:
            individual_counts[form] = sum(
                1 for incident_data in incidents_with_forms.values()
                if form in incident_data['forms']
            )
        
        # Calculate intersections for all combinations (2, 3, 4+ forms)
        intersections = {}
        
        # Pairs (2-way intersections)
        for form1, form2 in combinations(all_forms, 2):
            intersection_count = sum(
                1 for incident_data in incidents_with_forms.values()
                if form1 in incident_data['forms'] and form2 in incident_data['forms']
            )
            if intersection_count > 0:
                key = f"{form1} ∩ {form2}"
                intersections[key] = {
                    'forms': [form1, form2],
                    'count': intersection_count,
                    'type': 'intersection_2'
                }
        
        # Triple intersections (3-way)
        for form1, form2, form3 in combinations(all_forms, 3):
            intersection_count = sum(
                1 for incident_data in incidents_with_forms.values()
                if all(form in incident_data['forms'] for form in [form1, form2, form3])
            )
            if intersection_count > 0:
                key = f"{form1} ∩ {form2} ∩ {form3}"
                intersections[key] = {
                    'forms': [form1, form2, form3],
                    'count': intersection_count,
                    'type': 'intersection_3'
                }
        
        # Calculate exclusive counts (only one form)
        exclusive_counts = {}
        for form in all_forms:
            exclusive_count = sum(
                1 for incident_data in incidents_with_forms.values()
                if incident_data['forms'] == [form] or (len(incident_data['forms']) == 1 and form in incident_data['forms'])
            )
            if exclusive_count > 0:
                exclusive_counts[form] = exclusive_count
        
        # Prepare response for different visualization libraries
        venn_data = {
            'sets': [
                {
                    'name': form,
                    'size': individual_counts[form],
                    'exclusive': exclusive_counts.get(form, 0)
                }
                for form in all_forms
            ],
            'intersections': list(intersections.values()),
            'total_incidents': len(incidents_with_forms),
            'total_violence_records': violence_queryset.count(),
            
            # Additional data for specific charting libraries
            'chart_data': {
                # For Chart.js Venn diagrams
                'chartjs': [
                    {
                        'sets': [form],
                        'size': individual_counts[form],
                        'label': f"{form} ({individual_counts[form]})"
                    }
                    for form in all_forms
                ] + [
                    {
                        'sets': intersection['forms'],
                        'size': intersection['count'],
                        'label': f"{' & '.join(intersection['forms'])} ({intersection['count']})"
                    }
                    for intersection in intersections.values()
                ],
                
                # For ECharts or other libraries
                'echarts': {
                    'nodes': [
                        {
                            'name': form,
                            'value': individual_counts[form],
                            'category': 'violence_form'
                        }
                        for form in all_forms
                    ],
                    'links': [
                        {
                            'source': intersection['forms'][0],
                            'target': intersection['forms'][1],
                            'value': intersection['count'],
                            'label': f"Shared: {intersection['count']}"
                        }
                        for intersection in intersections.values()
                        if intersection['type'] == 'intersection_2'
                    ]
                }
            }
        }
        
        return JsonResponse({
            'format': 'venn',
            'data': venn_data
        })


# =====================================================================
# Additional list/detail endpoints for frontend consumption
# =====================================================================

class PublicationsListView(View):
    """GET /api/publications/?published=true&limit=20&offset=0"""

    def get(self, request):
        published_only = request.GET.get('published', 'true').lower() == 'true'
        try:
            limit = max(1, min(100, int(request.GET.get('limit', 20))))
            offset = max(0, int(request.GET.get('offset', 0)))
        except (TypeError, ValueError):
            limit, offset = 20, 0

        qs = Publications.objects.select_related('category')
        if published_only:
            qs = qs.filter(publish=True)
        qs = qs.order_by('-date_publish', '-created_at')

        total = qs.count()
        items = qs[offset:offset + limit]

        results = [
            {
                'id': p.id,
                'title': p.title,
                'slug': p.slug,
                'author': p.author or '',
                'category': p.category.title if p.category_id else None,
                'cover': p.img_cover.url if p.img_cover else None,
                'file': p.file.url if p.file else None,
                'date_publish': p.date_publish.isoformat() if p.date_publish else None,
                'visitor_count': p.visitor_count,
                'download_count': p.download_count,
                'url': f'/publication/{p.slug}',
            }
            for p in items
        ]
        return JsonResponse({
            'count': total,
            'limit': limit,
            'offset': offset,
            'results': results,
        })


class PublicationBySlugView(View):
    """GET /api/publications/by-slug/<slug>/"""

    def get(self, request, slug):
        p = get_object_or_404(Publications, slug=slug)
        return JsonResponse({
            'id': p.id,
            'title': p.title,
            'slug': p.slug,
            'author': p.author or '',
            'category': p.category.title if p.category_id else None,
            'cover': p.img_cover.url if p.img_cover else None,
            'file': p.file.url if p.file else None,
            'date_publish': p.date_publish.isoformat() if p.date_publish else None,
            'visitor_count': p.visitor_count,
            'download_count': p.download_count,
            'keterangan': p.keterangan or '',
            'img_credit': p.img_credit or '',
        })


class IncidentsListView(View):
    """GET /api/incidents/?year=2024&province=<id>&category=<slug>&limit=20&offset=0"""

    def get(self, request):
        try:
            limit = max(1, min(100, int(request.GET.get('limit', 20))))
            offset = max(0, int(request.GET.get('offset', 0)))
        except (TypeError, ValueError):
            limit, offset = 20, 0

        year = request.GET.get('year')
        province = request.GET.get('province')
        category_slug = request.GET.get('category')
        published_only = request.GET.get('published', 'true').lower() == 'true'

        qs = (
            Incidents.objects
            .select_related('location')
            .prefetch_related('category')
            .exclude(incident_date__year__in=EXCLUDED_YEARS)
        )
        if published_only:
            qs = qs.filter(publish=True)
        if year:
            qs = qs.filter(incident_date__year=year)
        if province:
            qs = qs.filter(location_id=province)
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        qs = qs.order_by('-incident_date', '-id').distinct()
        total = qs.count()
        items = qs[offset:offset + limit]

        results = []
        for i in items:
            cas = i.Incident_casualities.first()
            results.append({
                'id': i.id,
                'incident_id': i.incident_id,
                'date': i.incident_date.isoformat() if i.incident_date else None,
                'location': i.location.name if i.location_id else None,
                'location_id': i.location_id,
                'description': i.description,
                'link': i.link or '',
                'image': i.image.url if i.image else None,
                'categories': [c.title for c in i.category.all()],
                'casualties': {
                    'deaths': cas.num_death if cas else 0,
                    'injuries': cas.num_injured if cas else 0,
                    'female_deaths': cas.female_death if cas else 0,
                    'female_injuries': cas.female_injured if cas else 0,
                    'child_deaths': cas.child_death if cas else 0,
                    'child_injuries': cas.child_injured if cas else 0,
                } if cas else None,
            })

        return JsonResponse({
            'count': total,
            'limit': limit,
            'offset': offset,
            'results': results,
        })


class RegionsListView(View):
    """GET /api/regions/?level=province"""

    def get(self, request):
        level = request.GET.get('level', '').lower()
        qs = Regions.objects.select_related('category', 'parents').order_by('name')
        # level=province → only top-level (no parent)
        if level == 'province':
            qs = qs.filter(parents__isnull=True)

        results = [
            {
                'id': r.id,
                'name': r.name,
                'slug': r.slug,
                'area_code': r.area_code,
                'category': r.category.title if r.category_id else None,
                'parent': {'id': r.parents.id, 'name': r.parents.name} if r.parents_id else None,
            }
            for r in qs
        ]
        return JsonResponse({'count': len(results), 'results': results})


class OptionsByCategoryView(View):
    """GET /api/options/<category_id_or_slug>/ — list Options by Category"""

    def get(self, request, category):
        try:
            cat_id = int(category)
            qs = Options.objects.filter(category_id=cat_id)
        except (TypeError, ValueError):
            qs = Options.objects.filter(category__slug=category)

        qs = qs.select_related('category').order_by('title')
        results = [
            {
                'id': o.id,
                'title': o.title,
                'slug': o.slug,
                'category': o.category.title if o.category_id else None,
                'category_id': o.category_id,
                'image': o.img.url if o.img else None,
            }
            for o in qs
        ]
        return JsonResponse({'count': len(results), 'results': results})


class DashboardOverviewView(View):
    """GET /api/dashboard/overview/ — combined snapshot for landing page."""

    def get(self, request):
        from datetime import date
        today = date.today()
        current_year = today.year

        base = Incidents.objects.filter(publish=True).exclude(
            incident_date__year__in=EXCLUDED_YEARS
        )

        total_incidents = base.count()
        year_incidents = base.filter(incident_date__year=current_year).count()

        cas_agg = Casualities.objects.exclude(
            incident__incident_date__year__in=EXCLUDED_YEARS
        ).aggregate(
            deaths=Sum('num_death'),
            injuries=Sum('num_injured'),
            child_deaths=Sum('child_death'),
            female_deaths=Sum('female_death'),
        )

        latest = list(
            base
            .select_related('location')
            .order_by('-incident_date', '-id')[:5]
            .values('id', 'incident_id', 'incident_date', 'description', 'location__name')
        )
        for r in latest:
            r['date'] = r.pop('incident_date').isoformat() if r['incident_date'] else None
            r['location'] = r.pop('location__name')

        # Province counts (top 10)
        top_provinces = list(
            base.filter(location__isnull=False)
            .values('location__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        for p in top_provinces:
            p['province'] = p.pop('location__name')

        return JsonResponse({
            'total_incidents': total_incidents,
            'year_incidents': year_incidents,
            'current_year': current_year,
            'casualties': {
                'deaths': cas_agg['deaths'] or 0,
                'injuries': cas_agg['injuries'] or 0,
                'child_deaths': cas_agg['child_deaths'] or 0,
                'female_deaths': cas_agg['female_deaths'] or 0,
            },
            'top_provinces': top_provinces,
            'latest_incidents': latest,
        })
