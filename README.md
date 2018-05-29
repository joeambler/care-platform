# Care Platform

This project is the supporting code for my dissertation submitted to the University of Bristol in 2018. It is a Node.Js project which aims to enable smart devices (IoT) to forward 'events' to the platform, using an SDK generated from the OpenAPI specification for the project. The project aimed to build an architecture for bringing information from a smart device to a modelling component, giving the user fine-grained control over the use of their data.

Subject to a user granting the components permission, the platform will forward events in a pseudonymised form to a modelling component. If the modelling component detects anything of concern, it can send an 'alert' back to the platform (again, pseudonymised) which the platform will then forward to a user.

![A diagram demonstrating how the components interact with the platform](http://ambler.me/filestore/Architecture.png)
