import beaker

from examples.deployment_standard import (
    deploy_time_immutability_control,
    deploy_time_permanence_control,
)

app = (
    beaker.Application("App", descr="An app that has no abi methods")
    .apply(deploy_time_immutability_control)
    .apply(deploy_time_permanence_control)
)



