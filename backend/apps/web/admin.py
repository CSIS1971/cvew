from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from .models import *
from django.utils.html import format_html
from django.db.models import Count

# Define resource classes for each model
class CategoryResource(resources.ModelResource):
    class Meta:
        model = Category

class OptionsResource(resources.ModelResource):
    class Meta:
        model = Options

class RegionsResource(resources.ModelResource):
    class Meta:
        model = Regions

class IncidentsResource(resources.ModelResource):
    class Meta:
        model = Incidents

class ActorResource(resources.ModelResource):
    class Meta:
        model = Actor

class ViolenceResource(resources.ModelResource):
    class Meta:
        model = Violence

class CasualitiesResource(resources.ModelResource):
    class Meta:
        model = Casualities

class InterveneResource(resources.ModelResource):
    class Meta:
        model = Intervene

# Define inline admin classes
class ActorInline(admin.StackedInline):
    model = Actor
    extra = 1
    autocomplete_fields = ['actor', 'actor_atribute']

class ViolenceInline(admin.TabularInline):
    model = Violence
    extra = 1
    autocomplete_fields = ['violence_form', 'weapon_type', 'issue_type']

class CasualitiesInline(admin.TabularInline):
    model = Casualities
    extra = 1

class InterveneInline(admin.TabularInline):
    model = Intervene
    extra = 1
    autocomplete_fields = ['intervene_actor', 'intervene_actor_type']

# Define admin classes with import/export functionality
class CategoryAdmin(ImportExportModelAdmin):
    resource_class = CategoryResource
    list_display = ('id','title', 'keterangan')
    search_fields = ('title', 'keterangan')

class OptionsAdmin(ImportExportModelAdmin):
    resource_class = OptionsResource
    list_display = ('id', 'title',  'category', 'created_at', 'updated_at')
    search_fields = ('title', 'category__title')
    list_filter = ('category',)

class RegionsAdmin(ImportExportModelAdmin):
    resource_class = RegionsResource
    list_display = ('id','name', 'area_code' ,'category', 'parents', 'created_at', 'updated_at')
    search_fields = ('name', 'category__title', 'parents__name')
    list_filter = ('category',)
    autocomplete_fields = ['category', 'parents']

class IncidentsAdmin(ImportExportModelAdmin):
    resource_class = IncidentsResource
    list_display = ('incident_id', 'incident_date', 'location', 'coder', 'verificator', 'publish', 'created_at', 'updated_at')
    search_fields = ('incident_id', 'location__name', 'coder__username', 'verificator__username')
    list_filter = ('incident_date', 'publish')
    date_hierarchy = 'incident_date'
    autocomplete_fields = ['location', 'category', 'coder', 'verificator', 'incident_relation']
    inlines = [ActorInline, ViolenceInline, CasualitiesInline, InterveneInline]

    class IncidentsAdmin(ImportExportModelAdmin):
        resource_class = IncidentsResource
        list_display = (
        'incident_id', 'incident_date', 'location', 'coder', 'verificator', 'publish', 'created_at', 'updated_at')
        search_fields = ('incident_id', 'location__name', 'coder__username', 'verificator__username')
        list_filter = ('incident_date', 'publish')
        date_hierarchy = 'incident_date'
        autocomplete_fields = ['location', 'category', 'coder', 'verificator', 'incident_relation']
        inlines = [ActorInline, ViolenceInline, CasualitiesInline, InterveneInline]

        def get_readonly_fields(self, request, obj=None):
            if not request.user.has_perm('apps.web.can_publish_incident'):
                return self.readonly_fields + ('publish',)
            return self.readonly_fields

        def save_model(self, request, obj, form, change):
            if obj.publish and not obj.verificator:
                obj.verificator = request.user
            super().save_model(request, obj, form, change)

class ActorAdmin(ImportExportModelAdmin):
    resource_class = ActorResource
    list_display = ('incident', 'actor', 'actor_atribute', 'minorities', 'total_actor', 'created_at', 'updated_at')
    search_fields = ('incident__incident_id', 'actor__title', 'actor_atribute__title')
    list_filter = ('minorities',)
    autocomplete_fields = ['incident', 'actor', 'actor_atribute']

class ViolenceAdmin(ImportExportModelAdmin):
    resource_class = ViolenceResource
    list_display = ('incident', 'violence_form', 'weapon_type', 'issue_type', 'created_at', 'updated_at')
    search_fields = ('incident__incident_id', 'violence_form__title', 'weapon_type__title', 'issue_type__title')
    list_filter = ('violence_form', 'weapon_type', 'issue_type')
    autocomplete_fields = ['incident', 'violence_form', 'weapon_type', 'issue_type']

class CasualitiesAdmin(ImportExportModelAdmin):
    resource_class = CasualitiesResource
    list_display = ('incident', 'num_death', 'num_injured', 'death_injured', 'female_death', 'female_injured', 'child_death', 'child_injured', 'infra_damage', 'infra_destroyed', 'created_at', 'updated_at')
    search_fields = ('incident__incident_id',)
    list_filter = ('incident',)
    autocomplete_fields = ['incident']

class InterveneAdmin(ImportExportModelAdmin):
    resource_class = InterveneResource
    list_display = ('incident', 'intervene_actor', 'intervene_actor_type', 'result', 'created_at', 'updated_at')
    search_fields = ('incident__incident_id', 'intervene_actor__title', 'intervene_actor_type__title')
    list_filter = ('result',)
    autocomplete_fields = ['incident', 'intervene_actor', 'intervene_actor_type']

admin.site.register(Category, CategoryAdmin)
admin.site.register(Options, OptionsAdmin)
admin.site.register(Regions, RegionsAdmin)
admin.site.register(Incidents, IncidentsAdmin)
admin.site.register(Actor, ActorAdmin)
admin.site.register(Violence, ViolenceAdmin)
admin.site.register(Casualities, CasualitiesAdmin)
admin.site.register(Intervene, InterveneAdmin)


class DataValueInline(admin.TabularInline):
    model = DataValue
    extra = 1
    fields = ('region', 'value', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['region', ]


class DataNameAdmin(ImportExportModelAdmin):
    list_display = ('name', 'category', 'satuan', 'created_at', 'updated_at')
    search_fields = ('name', 'category__name', 'satuan__name')
    list_filter = ('category', 'satuan', 'created_at', 'updated_at')
    inlines = [DataValueInline]
    autocomplete_fields = ['category',]


class DataValueAdmin(ImportExportModelAdmin):
    list_display = ('name', 'region', 'value', 'created_at', 'updated_at')
    search_fields = ('name__name',)
    list_filter = ('name', 'region', 'created_at', 'updated_at')
    autocomplete_fields = ['region',]

# Register the admin classes with the associated models
admin.site.register(DataName, DataNameAdmin)
admin.site.register(DataValue, DataValueAdmin)


class PublicationsAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'date_publish', 'created_at', 'updated_at', 'visitor_count', 'publish', 'display_cover')
    list_filter = ('category', 'publish', 'created_at')
    search_fields = ('title', 'content', 'keterangan')
    readonly_fields = ('created_at', 'updated_at', 'visitor_count', 'slug')
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'author', 'category', 'content')
        }),
        ('Media', {
            'fields': ('file', 'img_cover', 'img_credit')
        }),
        ('Additional Information', {
            'fields': ('keterangan', 'visitor_count', 'publish')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'date_publish'),
            'classes': ('collapse',)
        })
    )

    def display_cover(self, obj):
        if obj.img_cover:
            return format_html('<img src="{}" width="50" height="50" />', obj.img_cover.url)
        return "No cover"

    display_cover.short_description = 'Cover'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _category_count=Count('category', distinct=True),
        )
        return queryset

    def category_count(self, obj):
        return obj._category_count

    category_count.admin_order_field = '_category_count'
    category_count.short_description = 'Category Count'

admin.site.register(Publications, PublicationsAdmin)