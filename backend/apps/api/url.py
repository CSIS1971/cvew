from django.urls import path
from .views import *

urlpatterns = [
    # Time-based incident data
    path('incidents/monthly/', MonthlyIncidentCountView.as_view(), name='monthly-incident-count'),
    path('incidents/monthly-by-category/', MonthlyIncidentCategoryView.as_view(), name='monthly-incidents-by-category'),
    
    # Category-based incident data
    path('incidents/categories/<str:category_slug>/', IncidentsByCategoryView.as_view(), name='incidents-by-category'),
    
    # Regional incident data
    path('incidents/regions/', ProvincialIncidentCountView.as_view(), name='incidents-by-region'),
    
    # Data statistics
    path('data/<slug:slug>/', DataNameDetailView.as_view(), name='data-name-detail'),
    
    # New endpoints for detailed incident data
    path('incidents/recent/', RecentIncidentsView.as_view(), name='recent-incidents'),
    path('incidents/<int:incident_id>/', IncidentDetailView.as_view(), name='incident-detail'),
    
    # Summary statistics
    path('statistics/summary/', IncidentSummaryView.as_view(), name='incident-summary'),

    # Publication statistics
    path('publications/<int:publication_id>/increment-views/', PublicationViewCountView.as_view(), name='publication-increment-views'),
    path('publications/<int:publication_id>/increment-downloads/', PublicationDownloadCountView.as_view(), name='publication-increment-downloads'),
    
    # Violence forms analytics
    path('violence/forms/analytics/', ViolenceFormsAnalyticsView.as_view(), name='violence-forms-analytics'),

    # — Frontend list/detail endpoints —
    path('publications/', PublicationsListView.as_view(), name='publications-list'),
    path('publications/by-slug/<slug:slug>/', PublicationBySlugView.as_view(), name='publication-by-slug'),
    path('incidents/', IncidentsListView.as_view(), name='incidents-list'),
    path('regions/', RegionsListView.as_view(), name='regions-list'),
    path('options/<str:category>/', OptionsByCategoryView.as_view(), name='options-by-category'),
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
]

