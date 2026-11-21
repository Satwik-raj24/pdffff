"""
Script to create sample_study_notes.pdf for presentation and viva demonstrations.
"""
import pymupdf

def generate_sample_pdf(filepath: str = "sample_study_notes.pdf"):
    doc = pymupdf.open()

    # Page 1: Neural Networks & Deep Learning Foundations
    p1 = doc.new_page()
    text_1 = """Artificial Intelligence & Deep Learning
Comprehensive Study Notes — Chapter 4: Neural Networks

1. Fundamentals of Artificial Neural Networks (ANN)
An Artificial Neural Network is a computational learning model inspired by the biological neural networks in animal brains. An ANN is composed of artificial neurons or nodes connected by directed edges with associated weights.

The basic computational unit is the Perceptron, introduced by Frank Rosenblatt in 1957. A perceptron receives multiple input features x_i, computes a weighted linear combination plus a bias term:
z = sum(w_i * x_i) + b
It then applies a non-linear activation function sigma(z) to produce an output activation.

2. Activation Functions
Non-linear activation functions allow neural networks to approximate arbitrary continuous functions (Universal Approximation Theorem):
- Sigmoid: Maps real values into (0, 1). Susceptible to the vanishing gradient problem for large positive or negative inputs.
- Rectified Linear Unit (ReLU): Defined as f(x) = max(0, x). Solves vanishing gradient for positive activations and speeds up convergence during gradient descent.
- Softmax: Normalizes an unconstrained K-dimensional vector of real scores into a categorical probability distribution summing to 1.0.
"""
    p1.insert_text((50, 60), text_1, fontsize=11)

    # Page 2: Optimization and Backpropagation
    p2 = doc.new_page()
    text_2 = """Artificial Intelligence & Deep Learning
Comprehensive Study Notes — Chapter 5: Optimization & Training

3. The Backpropagation Algorithm
Backpropagation (Rumelhart, Hinton, and Williams, 1986) is the foundational training method for multi-layer perceptrons. It efficiently computes the partial derivative (gradient) of the scalar objective loss function L with respect to every learnable weight w in the network using the calculus chain rule:
dL/dw = (dL/dy) * (dy/dz) * (dz/dw)
The gradients are propagated backward from the output layer through each hidden layer, enabling gradient descent updates:
w_new = w_old - eta * (dL/dw), where eta is the learning rate.

4. Modern Optimization Algorithms
While standard Stochastic Gradient Descent (SGD) updates parameters with a fixed step size, modern deep learning architectures use adaptive learning rate optimizers:
- Momentum: Accelerates SGD along directions of consistent gradient and dampens oscillations.
- RMSprop: Maintains a moving average of squared gradients to scale coordinates inversely by their recent magnitude.
- Adam (Adaptive Moment Estimation): Combines momentum (first moment estimate) and RMSprop (second moment estimate). It is widely regarded as the robust default optimizer in computer vision and natural language processing.
"""
    p2.insert_text((50, 60), text_2, fontsize=11)

    # Page 3: Overfitting and Regularization
    p3 = doc.new_page()
    text_3 = """Artificial Intelligence & Deep Learning
Comprehensive Study Notes — Chapter 6: Generalization & Regularization

5. The Generalization Problem and Overfitting
A neural network with high capacity can easily memorize training examples instead of learning generalizable underlying patterns. Overfitting is characterized by low training loss accompanied by high validation or test error.

6. Regularization Techniques
To prevent overfitting and enhance model robustness on unseen test data, deep learning practitioners employ several standard techniques:
- L2 Weight Decay: Adds a penalty proportional to the sum of squared weights to the loss function, encouraging the network to prefer small, diffuse weights.
- Dropout (Srivastava et al., 2014): Randomly sets a chosen fraction p (typically 0.2 to 0.5) of hidden unit activations to zero during each training forward pass. This prevents co-adaptation of features.
- Early Stopping: Monitors validation error during training and halts optimization before the network overfits the training distribution.
- Batch Normalization (Ioffe & Szegedy, 2015): Normalizes layer inputs across each mini-batch to have zero mean and unit variance, reducing internal covariate shift.
"""
    p3.insert_text((50, 60), text_3, fontsize=11)

    doc.save(filepath)
    doc.close()
    print(f"Sample PDF created: {filepath}")

if __name__ == "__main__":
    generate_sample_pdf()

