import rest_framework
from rest_framework.exceptions import APIException
from rest_framework import status, mixins, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import GenericViewSet
from rest_framework.pagination import CursorPagination
from rest_framework_extensions.routers import ExtendedSimpleRouter
from rest_framework_extensions.mixins import NestedViewSetMixin

import logging
from threading import Thread
import django_filters

from ..models import Project, ProjectFunction
from ..serializers import ProjectFunctionSerializer, ProjectSerializer, ScratchSerializer
from ..github import GitHubRepo, GitHubRepoBusy

logger = logging.getLogger(__name__)

class NotProjectMaintainer(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You must be a project maintainer to perform this action."

class ProjectPagination(CursorPagination):
    ordering="-creation_time"
    page_size=20
    page_size_query_param="page_size"
    max_page_size=100

class ProjectFunctionPagination(CursorPagination):
    ordering="-creation_time"
    page_size=20
    page_size_query_param="page_size"
    max_page_size=100

class ProjectViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    queryset = Project.objects.all()
    pagination_class = ProjectPagination
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['POST'])
    def pull(self, request, pk):
        project: Project = self.get_object()
        repo: GitHubRepo = project.repo

        if not repo.is_maintainer(request):
            raise NotProjectMaintainer()

        if not repo.is_pulling:
            t = Thread(target=GitHubRepo.pull, args=(project.repo,))
            t.start()

        repo.is_pulling = True # Respond with is_pulling=True; the thread will save is_pulling=True to the DB
        return Response(ProjectSerializer(project, context={ "request": request }).data, status=status.HTTP_202_ACCEPTED)

class ProjectFunctionViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    pagination_class = ProjectFunctionPagination
    serializer_class = ProjectFunctionSerializer

    filter_fields = ['rom_address']
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['display_name']

    def get_queryset(self):
        return ProjectFunction.objects.filter(project=self.kwargs["parent_lookup_slug"])

    @action(detail=True, methods=['POST'])
    def start(self, request, **kwargs):
        function: ProjectFunction = self.get_object()
        project: Project = function.project
        repo: GitHubRepo = project.repo

        if repo.is_pulling:
            raise GitHubRepoBusy()

        scratch = function.create_scratch()
        if scratch.is_claimable():
            scratch.owner = request.profile
            scratch.save()

        return Response(ScratchSerializer(scratch, context={ "request": request }).data, status=status.HTTP_201_CREATED)

router = ExtendedSimpleRouter(trailing_slash=False)
(
    router.register(r'projects', ProjectViewSet)
        .register(r'functions', ProjectFunctionViewSet, basename='projectfunction', parents_query_lookups=['slug'])
)
