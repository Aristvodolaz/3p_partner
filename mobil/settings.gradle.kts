pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "3P Partner TSD"

include(":app")
include(":core:model")
include(":core:network")
include(":core:data")
include(":core:designsystem")
include(":feature:requests")
include(":feature:receiving")
include(":feature:storage")
include(":feature:shipping")
include(":feature:documents")
include(":feature:settings")
