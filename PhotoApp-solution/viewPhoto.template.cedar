// viewPhoto template
@id("viewPhoto.template.cedar")
permit (
  principal in ?principal,
  action == PhotoApp::Action::"viewPhoto",
  resource in ?resource
);